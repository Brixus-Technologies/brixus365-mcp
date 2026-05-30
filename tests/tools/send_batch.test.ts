import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerSendBatchTool } from "../../src/tools/send_batch.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(sendEmailBatch: BrixusClient["sendEmailBatch"]): BrixusClient {
  return { sendEmailBatch } as unknown as BrixusClient;
}

describe("brixus_send_email_batch handler", () => {
  it("happy path returns batch summary", async () => {
    const mock = makeMockServer();
    const summary = { queued: 2, failed: 0, total: 2, results: [] };
    const sendEmailBatch = vi.fn(async () => summary);
    registerSendBatchTool(
      mock as unknown as Parameters<typeof registerSendBatchTool>[0],
      makeFakeClient(sendEmailBatch),
    );
    const result = await mock.lastHandler()({
      messages: [
        { to: "a@b.com", starter_template: "auth-reset" },
        { to: "c@d.com", starter_template: "auth-reset" },
      ],
    });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.queued).toBe(2);
    expect(sendEmailBatch).toHaveBeenCalledTimes(1);
  });

  it("rate_limit_exceeded surfaces with retry hint", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(429, {
      error: {
        code: "rate_limit_exceeded",
        message: "Too many.",
        type: "rate_limit",
        retry_after_seconds: 10,
      },
    });
    const sendEmailBatch = vi.fn(async () => { throw err; });
    registerSendBatchTool(
      mock as unknown as Parameters<typeof registerSendBatchTool>[0],
      makeFakeClient(sendEmailBatch),
    );
    const result = await mock.lastHandler()({
      messages: [{ to: "a@b.com", starter_template: "auth-reset" }],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("10s");
  });
});

import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerListEmailsTool } from "../../src/tools/list_emails.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(listEmails: BrixusClient["listEmails"]): BrixusClient {
  return { listEmails } as unknown as BrixusClient;
}

describe("brixus_list_emails handler", () => {
  it("happy path returns email list", async () => {
    const mock = makeMockServer();
    const payload = { items: [{ messageId: "m1", status: "delivered" }], total: 1 };
    const listEmails = vi.fn(async () => payload);
    registerListEmailsTool(
      mock as unknown as Parameters<typeof registerListEmailsTool>[0],
      makeFakeClient(listEmails),
    );
    const result = await mock.lastHandler()({ status: "delivered", limit: 10 });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.total).toBe(1);
  });

  it("forwards filter params to client", async () => {
    const mock = makeMockServer();
    const listEmails = vi.fn(async () => ({ items: [], total: 0 }));
    registerListEmailsTool(
      mock as unknown as Parameters<typeof registerListEmailsTool>[0],
      makeFakeClient(listEmails),
    );
    await mock.lastHandler()({
      status: "bounced",
      skip: 0,
      limit: 25,
      sort_by: "sent_at",
    });
    expect(listEmails).toHaveBeenCalledWith(
      expect.objectContaining({ status: "bounced", skip: 0, limit: 25, sort_by: "sent_at" }),
    );
  });

  it("API error surfaces as isError", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(401, {
      error: { code: "invalid_api_key", message: "Bad key.", type: "auth" },
    });
    const listEmails = vi.fn(async () => { throw err; });
    registerListEmailsTool(
      mock as unknown as Parameters<typeof registerListEmailsTool>[0],
      makeFakeClient(listEmails),
    );
    const result = await mock.lastHandler()({});
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("invalid_api_key");
  });
});

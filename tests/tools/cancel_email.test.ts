import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerCancelEmailTool } from "../../src/tools/cancel_email.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(cancelEmail: BrixusClient["cancelEmail"]): BrixusClient {
  return { cancelEmail } as unknown as BrixusClient;
}

describe("brixus_cancel_email handler", () => {
  it("happy path returns success confirmation", async () => {
    const mock = makeMockServer();
    const cancelEmail = vi.fn(async () => undefined);
    registerCancelEmailTool(
      mock as unknown as Parameters<typeof registerCancelEmailTool>[0],
      makeFakeClient(cancelEmail),
    );
    const result = await mock.lastHandler()({ message_id: "msg_live_01J" });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.success).toBe(true);
    expect(cancelEmail).toHaveBeenCalledWith("msg_live_01J");
  });

  it("message_already_dispatched returns isError with fix hint", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(409, {
      error: { code: "message_already_dispatched", message: "Already sent.", type: "conflict" },
    });
    const cancelEmail = vi.fn(async () => { throw err; });
    registerCancelEmailTool(
      mock as unknown as Parameters<typeof registerCancelEmailTool>[0],
      makeFakeClient(cancelEmail),
    );
    const result = await mock.lastHandler()({ message_id: "msg_live_01J" });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("message_already_dispatched");
    expect(result.content[0]!.text).toContain("scheduled");
  });
});

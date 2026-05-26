import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerGetEmailTool } from "../../src/tools/get_email.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(getEmail: BrixusClient["getEmail"]): BrixusClient {
  return { getEmail } as unknown as BrixusClient;
}

describe("brixus_get_email handler", () => {
  it("happy path returns message details", async () => {
    const mock = makeMockServer();
    const detail = {
      messageId: "msg_live_01J",
      status: "delivered",
      from: "no-reply@example.com",
      to: "alice@test.com",
      createdAt: "2024-01-01T00:00:00Z",
    };
    const getEmail = vi.fn(async () => detail);
    registerGetEmailTool(
      mock as unknown as Parameters<typeof registerGetEmailTool>[0],
      makeFakeClient(getEmail),
    );
    const result = await mock.lastHandler()({ message_id: "msg_live_01J" });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.messageId).toBe("msg_live_01J");
    expect(result.structuredContent?.status).toBe("delivered");
    expect(getEmail).toHaveBeenCalledWith("msg_live_01J");
  });

  it("message_not_found returns isError with actionable text", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(404, {
      error: { code: "message_not_found", message: "Not found.", type: "not_found" },
    });
    const getEmail = vi.fn(async () => { throw err; });
    registerGetEmailTool(
      mock as unknown as Parameters<typeof registerGetEmailTool>[0],
      makeFakeClient(getEmail),
    );
    const result = await mock.lastHandler()({ message_id: "bad_id" });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("message_not_found");
    expect(result.content[0]!.text).toContain("brixus_list_emails");
  });
});

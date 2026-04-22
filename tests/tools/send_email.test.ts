/**
 * Tests for the brixus_send_email tool handler.
 *
 * Instead of running a real McpServer and roundtripping JSON-RPC, we
 * stub `registerTool` on a lightweight mock server to capture the
 * async handler, then invoke it directly. This keeps the tests fast
 * and lets us assert on the exact BrixusClient.sendEmail call shape
 * and the returned MCP tool response body.
 */

import { describe, expect, it, vi } from "vitest";

import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { SendEmailInputSchema } from "../../src/schemas/send_email.js";
import { registerSendEmailTool } from "../../src/tools/send_email.js";

type Handler = (
  args: Record<string, unknown>,
) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

interface MockServer {
  registerTool: ReturnType<typeof vi.fn>;
  lastHandler: () => Handler;
}

function makeMockServer(): MockServer {
  const register = vi.fn();
  return {
    registerTool: register,
    lastHandler: () => register.mock.calls[0]![2] as Handler,
  };
}

function makeFakeClient(
  sendEmail: BrixusClient["sendEmail"],
): BrixusClient {
  return { sendEmail } as unknown as BrixusClient;
}

describe("brixus_send_email handler", () => {
  it("happy path returns structuredContent with messageId", async () => {
    const mock = makeMockServer();
    const send = vi.fn(async () => ({
      messageId: "msg_preview_123",
      status: "queued",
      from: "Alice <noreply@preview.brixus365.com>",
    }));
    registerSendEmailTool(
      mock as unknown as Parameters<typeof registerSendEmailTool>[0],
      makeFakeClient(send as unknown as BrixusClient["sendEmail"]),
    );
    const handler = mock.lastHandler();
    const result = await handler({
      to: "alice@example.com",
      starter_template: "auth-reset",
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.messageId).toBe("msg_preview_123");
    expect(result.structuredContent?.status).toBe("queued");
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.messageId).toBe("msg_preview_123");
  });

  it("forwards from_name and variables to client", async () => {
    const mock = makeMockServer();
    const send = vi.fn(async () => ({
      messageId: "m",
      status: "queued",
      from: "x",
    }));
    registerSendEmailTool(
      mock as unknown as Parameters<typeof registerSendEmailTool>[0],
      makeFakeClient(send as unknown as BrixusClient["sendEmail"]),
    );
    const handler = mock.lastHandler();
    await handler({
      to: "alice@example.com",
      starter_template: "auth-reset",
      variables: { x: 1 },
      from_name: "Alice",
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]![0]).toEqual({
      to: "alice@example.com",
      starter_template: "auth-reset",
      variables: { x: 1 },
      from_name: "Alice",
    });
  });

  it("upgrade_required error is surfaced with upgrade_url in text", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(402, {
      error: {
        code: "upgrade_required",
        message: "Preview tier exhausted.",
        type: "subscription",
        upgrade_url: "https://app.example.test/upgrade",
      },
    });
    const send = vi.fn(async () => {
      throw err;
    });
    registerSendEmailTool(
      mock as unknown as Parameters<typeof registerSendEmailTool>[0],
      makeFakeClient(send as unknown as BrixusClient["sendEmail"]),
    );
    const handler = mock.lastHandler();
    const result = await handler({
      to: "alice@example.com",
      starter_template: "auth-reset",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("upgrade_required");
    expect(result.content[0]!.text).toContain(
      "https://app.example.test/upgrade",
    );
  });

  it("rate_limit_exceeded includes retry_after_seconds hint", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(429, {
      error: {
        code: "rate_limit_exceeded",
        message: "Too many requests.",
        type: "rate_limit",
        retry_after_seconds: 42,
      },
    });
    const send = vi.fn(async () => {
      throw err;
    });
    registerSendEmailTool(
      mock as unknown as Parameters<typeof registerSendEmailTool>[0],
      makeFakeClient(send as unknown as BrixusClient["sendEmail"]),
    );
    const handler = mock.lastHandler();
    const result = await handler({
      to: "alice@example.com",
      starter_template: "auth-reset",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("rate_limit_exceeded");
    expect(result.content[0]!.text).toContain("42s");
  });

  it("network error returns isError:true with (network) prefix", async () => {
    const mock = makeMockServer();
    const send = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    registerSendEmailTool(
      mock as unknown as Parameters<typeof registerSendEmailTool>[0],
      makeFakeClient(send as unknown as BrixusClient["sendEmail"]),
    );
    const handler = mock.lastHandler();
    const result = await handler({
      to: "alice@example.com",
      starter_template: "auth-reset",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text.startsWith("Error (network)")).toBe(true);
  });
});

describe("brixus_send_email input schema", () => {
  it("rejects non-email `to`", () => {
    const res = SendEmailInputSchema.safeParse({
      to: "not-an-email",
      starter_template: "auth-reset",
    });
    expect(res.success).toBe(false);
  });

  it("rejects starter_template with underscore", () => {
    const res = SendEmailInputSchema.safeParse({
      to: "a@b.co",
      starter_template: "bad_slug",
    });
    expect(res.success).toBe(false);
  });

  it("accepts a valid minimal input", () => {
    const res = SendEmailInputSchema.safeParse({
      to: "a@b.co",
      starter_template: "auth-reset",
    });
    expect(res.success).toBe(true);
  });

  it("rejects extra keys with .strict()", () => {
    const res = SendEmailInputSchema.safeParse({
      to: "a@b.co",
      starter_template: "auth-reset",
      bogus: "x",
    });
    expect(res.success).toBe(false);
  });
});

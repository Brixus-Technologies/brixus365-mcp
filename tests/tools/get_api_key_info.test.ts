import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerGetApiKeyInfoTool } from "../../src/tools/get_api_key_info.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(getApiKeyInfo: BrixusClient["getApiKeyInfo"]): BrixusClient {
  return { getApiKeyInfo } as unknown as BrixusClient;
}

describe("brixus_get_api_key_info handler", () => {
  it("returns tier and usage", async () => {
    const mock = makeMockServer();
    const info = {
      tier: "pro",
      usageToday: 42,
      usageMonth: 1200,
      limits: { daily: 10000, monthly: 100000, ratePerMinute: 60 },
      allowedModes: ["starter_template", "template_id", "html"],
    };
    const getApiKeyInfo = vi.fn(async () => info);
    registerGetApiKeyInfoTool(
      mock as unknown as Parameters<typeof registerGetApiKeyInfoTool>[0],
      makeFakeClient(getApiKeyInfo),
    );
    const result = await mock.lastHandler()({});
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.tier).toBe("pro");
    expect(parsed.usageToday).toBe(42);
    expect(parsed.allowedModes).toContain("html");
  });

  it("jwt_required error surfaces clearly (JWT callers should not use this tool)", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(403, {
      error: { code: "jwt_required", message: "API key only.", type: "auth" },
    });
    const getApiKeyInfo = vi.fn(async () => { throw err; });
    registerGetApiKeyInfoTool(
      mock as unknown as Parameters<typeof registerGetApiKeyInfoTool>[0],
      makeFakeClient(getApiKeyInfo),
    );
    const result = await mock.lastHandler()({});
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("jwt_required");
  });
});

import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerSendCampaignTestTool } from "../../src/tools/send_campaign_test.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(sendCampaignTest: BrixusClient["sendCampaignTest"]): BrixusClient {
  return { sendCampaignTest } as unknown as BrixusClient;
}

const CAMPAIGN_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("brixus_send_campaign_test handler", () => {
  it("happy path returns send result", async () => {
    const mock = makeMockServer();
    const resp = { success: true, message: "Test sent.", emailsSent: 2, failedEmails: [] };
    const sendCampaignTest = vi.fn(async () => resp);
    registerSendCampaignTestTool(
      mock as unknown as Parameters<typeof registerSendCampaignTestTool>[0],
      makeFakeClient(sendCampaignTest),
    );
    const result = await mock.lastHandler()({
      campaign_id: CAMPAIGN_UUID,
      test_emails: ["a@test.com", "b@test.com"],
    });
    expect(result.isError).toBeFalsy();
    expect(sendCampaignTest).toHaveBeenCalledWith(CAMPAIGN_UUID, ["a@test.com", "b@test.com"]);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.success).toBe(true);
    expect(parsed.emailsSent).toBe(2);
  });

  it("scope_required for marketing:campaigns:send surfaces correctly", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(403, {
      error: {
        code: "scope_required",
        message: "Missing permission.",
        type: "auth",
        details: { required_scope: "marketing:campaigns:send" },
      },
    });
    const sendCampaignTest = vi.fn(async () => { throw err; });
    registerSendCampaignTestTool(
      mock as unknown as Parameters<typeof registerSendCampaignTestTool>[0],
      makeFakeClient(sendCampaignTest),
    );
    const result = await mock.lastHandler()({
      campaign_id: CAMPAIGN_UUID,
      test_emails: ["a@test.com"],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("marketing:campaigns:send");
    expect(result.content[0]!.text).toContain("marketing:write");
  });

  it("campaign_not_found returns actionable error", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(404, {
      error: { code: "campaign_not_found", message: "Not found.", type: "not_found" },
    });
    const sendCampaignTest = vi.fn(async () => { throw err; });
    registerSendCampaignTestTool(
      mock as unknown as Parameters<typeof registerSendCampaignTestTool>[0],
      makeFakeClient(sendCampaignTest),
    );
    const result = await mock.lastHandler()({
      campaign_id: CAMPAIGN_UUID,
      test_emails: ["a@test.com"],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("brixus_list_campaigns");
  });
});

import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerSendCampaignTool } from "../../src/tools/send_campaign.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(sendCampaign: BrixusClient["sendCampaign"]): BrixusClient {
  return { sendCampaign } as unknown as BrixusClient;
}

const CAMPAIGN_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("brixus_send_campaign handler", () => {
  it("happy path calls client.sendCampaign with acknowledge_quota_overage undefined", async () => {
    const mock = makeMockServer();
    const sendCampaign = vi.fn(async () => ({ message: "ok" }));
    registerSendCampaignTool(
      mock as unknown as Parameters<typeof registerSendCampaignTool>[0],
      makeFakeClient(sendCampaign),
    );
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBeFalsy();
    expect(sendCampaign).toHaveBeenCalledWith(CAMPAIGN_UUID, undefined);
  });

  it("threads acknowledge_quota_overage: true through to the client", async () => {
    const mock = makeMockServer();
    const sendCampaign = vi.fn(async () => ({ message: "ok" }));
    registerSendCampaignTool(
      mock as unknown as Parameters<typeof registerSendCampaignTool>[0],
      makeFakeClient(sendCampaign),
    );
    await mock.lastHandler()({
      campaign_id: CAMPAIGN_UUID,
      acknowledge_quota_overage: true,
    });
    expect(sendCampaign).toHaveBeenCalledWith(CAMPAIGN_UUID, true);
  });

  it("daily_quota_partial with will_send_now > 0 tells the agent to retry with acknowledgment", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(409, {
      error: {
        code: "daily_quota_partial",
        type: "invalid_request_error",
        message: "Daily sending quota covers 4300 of 12000 recipients.",
        total_recipients: 12000,
        daily_limit: 10000,
        daily_remaining: 4300,
        will_send_now: 4300,
        will_defer: 7700,
      },
    });
    const sendCampaign = vi.fn(async () => { throw err; });
    registerSendCampaignTool(
      mock as unknown as Parameters<typeof registerSendCampaignTool>[0],
      makeFakeClient(sendCampaign),
    );
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("acknowledge_quota_overage: true");
    expect(result.content[0]!.text).toContain("4300");
    expect(result.content[0]!.text).toContain("7700");
  });

  it("daily_quota_partial with will_send_now === 0 tells the agent not to retry", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(409, {
      error: {
        code: "daily_quota_partial",
        type: "invalid_request_error",
        message: "No sends remain in today's quota.",
        total_recipients: 500,
        daily_limit: 10000,
        daily_remaining: 0,
        will_send_now: 0,
        will_defer: 500,
      },
    });
    const sendCampaign = vi.fn(async () => { throw err; });
    registerSendCampaignTool(
      mock as unknown as Parameters<typeof registerSendCampaignTool>[0],
      makeFakeClient(sendCampaign),
    );
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("do not retry");
    expect(result.content[0]!.text).not.toContain("acknowledge_quota_overage: true");
  });
});

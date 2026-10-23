import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { CancelScheduledCampaignInputSchema } from "../../src/schemas/cancel_scheduled_campaign.js";
import { registerCancelScheduledCampaignTool } from "../../src/tools/cancel_scheduled_campaign.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return {
    registerTool: register,
    lastConfig: () => register.mock.calls[0]![1] as {
      annotations: Record<string, boolean>;
      description: string;
    },
    lastHandler: () => register.mock.calls[0]![2] as Handler,
  };
}

function makeFakeClient(
  cancelScheduledCampaign: BrixusClient["cancelScheduledCampaign"],
): BrixusClient {
  return { cancelScheduledCampaign } as unknown as BrixusClient;
}

const CAMPAIGN_UUID = "123e4567-e89b-12d3-a456-426614174000";

function register(cancelScheduledCampaign: BrixusClient["cancelScheduledCampaign"]) {
  const mock = makeMockServer();
  registerCancelScheduledCampaignTool(
    mock as unknown as Parameters<typeof registerCancelScheduledCampaignTool>[0],
    makeFakeClient(cancelScheduledCampaign),
  );
  return mock;
}

describe("brixus_cancel_scheduled_campaign handler", () => {
  it("registers under the expected name with the expected annotations", () => {
    const mock = register(vi.fn());
    expect(mock.registerTool.mock.calls[0]![0]).toBe("brixus_cancel_scheduled_campaign");
    expect(mock.lastConfig().annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    });
    expect(mock.lastConfig().description).toContain("marketing:write");
  });

  it("warns that a cancelled campaign can't be scheduled or sent again from MCP and points to reschedule", () => {
    const mock = register(vi.fn());
    expect(mock.lastConfig().description).toMatch(/can't\s+be scheduled or sent again/);
    expect(mock.lastConfig().description).toContain("brixus_reschedule_campaign");
  });

  it("happy path calls the client with the campaign id and returns the draft campaign", async () => {
    const campaign = { id: CAMPAIGN_UUID, status: "draft" };
    const cancelScheduledCampaign = vi.fn(async () => campaign);
    const mock = register(cancelScheduledCampaign);
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual(campaign);
    expect(cancelScheduledCampaign).toHaveBeenCalledWith(CAMPAIGN_UUID);
  });

  it("API error (campaign not scheduled) returns isError with the backend message", async () => {
    const err = new BrixusApiError(400, {
      error: {
        code: "invalid_request",
        type: "invalid_request_error",
        message: "Only scheduled campaigns can be cancelled",
      },
    });
    const mock = register(vi.fn(async () => { throw err; }));
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Only scheduled campaigns can be cancelled");
  });

  it("scope_required maps to the api-keys hint", async () => {
    const err = new BrixusApiError(403, {
      error: { code: "scope_required", type: "permission_error", message: "Needs marketing:write." },
    });
    const mock = register(vi.fn(async () => { throw err; }));
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("settings/api-keys");
  });
});

describe("CancelScheduledCampaignInputSchema", () => {
  it("accepts a UUID and rejects a non-UUID or extra keys", () => {
    expect(CancelScheduledCampaignInputSchema.safeParse({ campaign_id: CAMPAIGN_UUID }).success).toBe(true);
    expect(CancelScheduledCampaignInputSchema.safeParse({ campaign_id: "nope" }).success).toBe(false);
    expect(
      CancelScheduledCampaignInputSchema.safeParse({ campaign_id: CAMPAIGN_UUID, extra: 1 }).success,
    ).toBe(false);
  });
});

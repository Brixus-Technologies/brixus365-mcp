import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { RescheduleCampaignInputSchema } from "../../src/schemas/reschedule_campaign.js";
import { registerRescheduleCampaignTool } from "../../src/tools/reschedule_campaign.js";

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

function makeFakeClient(rescheduleCampaign: BrixusClient["rescheduleCampaign"]): BrixusClient {
  return { rescheduleCampaign } as unknown as BrixusClient;
}

const CAMPAIGN_UUID = "123e4567-e89b-12d3-a456-426614174000";
const NEW_TIME = "2026-11-01T09:00:00Z";

function register(rescheduleCampaign: BrixusClient["rescheduleCampaign"]) {
  const mock = makeMockServer();
  registerRescheduleCampaignTool(
    mock as unknown as Parameters<typeof registerRescheduleCampaignTool>[0],
    makeFakeClient(rescheduleCampaign),
  );
  return mock;
}

describe("brixus_reschedule_campaign handler", () => {
  it("registers under the expected name with the expected annotations", () => {
    const mock = register(vi.fn());
    expect(mock.registerTool.mock.calls[0]![0]).toBe("brixus_reschedule_campaign");
    expect(mock.lastConfig().annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    });
    expect(mock.lastConfig().description).toContain("marketing:write");
  });

  it("does not steer agents to brixus_send_campaign (it sends immediately)", () => {
    const mock = register(vi.fn());
    expect(mock.lastConfig().description).not.toContain("brixus_send_campaign");
    expect(mock.lastConfig().description).toContain("brixus_update_campaign");
  });

  it("happy path passes campaign_id and scheduled_at to the client and returns the campaign", async () => {
    const campaign = { id: CAMPAIGN_UUID, status: "scheduled", scheduledAt: NEW_TIME };
    const rescheduleCampaign = vi.fn(async () => campaign);
    const mock = register(rescheduleCampaign);
    const result = await mock.lastHandler()({
      campaign_id: CAMPAIGN_UUID,
      scheduled_at: NEW_TIME,
    });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual(campaign);
    expect(rescheduleCampaign).toHaveBeenCalledWith(CAMPAIGN_UUID, NEW_TIME);
  });

  it("API error (campaign not scheduled) returns isError with the backend message", async () => {
    const err = new BrixusApiError(400, {
      error: {
        code: "invalid_request",
        type: "invalid_request_error",
        message: "Only scheduled campaigns can be rescheduled",
      },
    });
    const mock = register(vi.fn(async () => { throw err; }));
    const result = await mock.lastHandler()({
      campaign_id: CAMPAIGN_UUID,
      scheduled_at: NEW_TIME,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Only scheduled campaigns can be rescheduled");
  });

  it("campaign_not_found maps to the list_campaigns hint", async () => {
    const err = new BrixusApiError(404, {
      error: { code: "campaign_not_found", type: "not_found", message: "No such campaign." },
    });
    const mock = register(vi.fn(async () => { throw err; }));
    const result = await mock.lastHandler()({
      campaign_id: CAMPAIGN_UUID,
      scheduled_at: NEW_TIME,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("brixus_list_campaigns");
  });
});

describe("RescheduleCampaignInputSchema", () => {
  it("accepts a UUID and an ISO 8601 datetime with an offset", () => {
    expect(
      RescheduleCampaignInputSchema.safeParse({
        campaign_id: CAMPAIGN_UUID,
        scheduled_at: "2026-11-01T09:00:00+01:00",
      }).success,
    ).toBe(true);
  });

  it("rejects a missing scheduled_at, a non-UUID id and a timezone-less datetime", () => {
    expect(RescheduleCampaignInputSchema.safeParse({ campaign_id: CAMPAIGN_UUID }).success).toBe(false);
    expect(
      RescheduleCampaignInputSchema.safeParse({ campaign_id: "nope", scheduled_at: NEW_TIME }).success,
    ).toBe(false);
    expect(
      RescheduleCampaignInputSchema.safeParse({
        campaign_id: CAMPAIGN_UUID,
        scheduled_at: "2026-11-01T09:00:00",
      }).success,
    ).toBe(false);
  });
});

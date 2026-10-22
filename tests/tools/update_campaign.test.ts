import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { UpdateCampaignInputSchema } from "../../src/schemas/update_campaign.js";
import { registerUpdateCampaignTool } from "../../src/tools/update_campaign.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

const CAMPAIGN_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("brixus_update_campaign handler", () => {
  it("passes scheduled_at through to client.updateCampaign", async () => {
    const register = vi.fn();
    const updateCampaign = vi.fn(async () => ({ id: CAMPAIGN_UUID, status: "scheduled" }));
    registerUpdateCampaignTool(
      { registerTool: register } as unknown as Parameters<typeof registerUpdateCampaignTool>[0],
      { updateCampaign } as unknown as BrixusClient,
    );
    const handler = register.mock.calls[0]![2] as Handler;

    const result = await handler({
      campaign_id: CAMPAIGN_UUID,
      scheduled_at: "2026-11-01T09:00:00Z",
    });

    expect(result.isError).toBeFalsy();
    expect(updateCampaign).toHaveBeenCalledWith(CAMPAIGN_UUID, {
      scheduled_at: "2026-11-01T09:00:00Z",
    });
  });

  it("description points scheduled campaigns at reschedule / cancel", () => {
    const register = vi.fn();
    registerUpdateCampaignTool(
      { registerTool: register } as unknown as Parameters<typeof registerUpdateCampaignTool>[0],
      {} as BrixusClient,
    );
    const { description } = register.mock.calls[0]![1] as { description: string };
    expect(description).toContain("brixus_reschedule_campaign");
    expect(description).toContain("brixus_cancel_scheduled_campaign");
  });
});

describe("UpdateCampaignInputSchema.scheduled_at", () => {
  it("accepts an ISO 8601 datetime with an offset", () => {
    for (const scheduled_at of ["2026-11-01T09:00:00Z", "2026-11-01T09:00:00+01:00"]) {
      expect(
        UpdateCampaignInputSchema.safeParse({ campaign_id: CAMPAIGN_UUID, scheduled_at }).success,
      ).toBe(true);
    }
  });

  it("rejects a timezone-less datetime and a non-datetime string", () => {
    for (const scheduled_at of ["2026-11-01T09:00:00", "tomorrow"]) {
      expect(
        UpdateCampaignInputSchema.safeParse({ campaign_id: CAMPAIGN_UUID, scheduled_at }).success,
      ).toBe(false);
    }
  });

  it("is still optional, so name-only updates are unaffected", () => {
    expect(
      UpdateCampaignInputSchema.safeParse({ campaign_id: CAMPAIGN_UUID, name: "Renamed" }).success,
    ).toBe(true);
  });
});

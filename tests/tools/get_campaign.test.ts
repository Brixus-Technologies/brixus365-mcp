import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerGetCampaignTool } from "../../src/tools/get_campaign.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(getCampaign: BrixusClient["getCampaign"]): BrixusClient {
  return { getCampaign } as unknown as BrixusClient;
}

const CAMPAIGN_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("brixus_get_campaign handler", () => {
  it("happy path returns campaign detail", async () => {
    const mock = makeMockServer();
    const detail = { id: CAMPAIGN_UUID, name: "Spring Sale", status: "sent", recipientsCount: 1000 };
    const getCampaign = vi.fn(async () => detail);
    registerGetCampaignTool(
      mock as unknown as Parameters<typeof registerGetCampaignTool>[0],
      makeFakeClient(getCampaign),
    );
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.id).toBe(CAMPAIGN_UUID);
    expect(getCampaign).toHaveBeenCalledWith(CAMPAIGN_UUID);
  });

  it("campaign_not_found surfaces with list hint", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(404, {
      error: { code: "campaign_not_found", message: "Not found.", type: "not_found" },
    });
    const getCampaign = vi.fn(async () => { throw err; });
    registerGetCampaignTool(
      mock as unknown as Parameters<typeof registerGetCampaignTool>[0],
      makeFakeClient(getCampaign),
    );
    const result = await mock.lastHandler()({ campaign_id: CAMPAIGN_UUID });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("campaign_not_found");
    expect(result.content[0]!.text).toContain("brixus_list_campaigns");
  });
});

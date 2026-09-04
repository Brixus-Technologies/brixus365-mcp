import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { registerCreateCampaignTool } from "../../src/tools/create_campaign.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(createCampaign: BrixusClient["createCampaign"]): BrixusClient {
  return { createCampaign } as unknown as BrixusClient;
}

const TEMPLATE_UUID = "123e4567-e89b-12d3-a456-426614174000";
const GROUP_UUID = "223e4567-e89b-12d3-a456-426614174001";
const SENDER_UUID = "323e4567-e89b-12d3-a456-426614174002";

function register(createCampaign: ReturnType<typeof vi.fn>) {
  const mock = makeMockServer();
  registerCreateCampaignTool(
    mock as unknown as Parameters<typeof registerCreateCampaignTool>[0],
    makeFakeClient(createCampaign as unknown as BrixusClient["createCampaign"]),
  );
  return mock;
}

describe("brixus_create_campaign handler", () => {
  it("threads sender_address_id through to the client", async () => {
    const createCampaign = vi.fn(async () => ({ id: "c1" }));
    const mock = register(createCampaign);

    const result = await mock.lastHandler()({
      name: "Launch",
      channel: "email",
      template_id: TEMPLATE_UUID,
      recipient_group_ids: [GROUP_UUID],
      sender_address_id: SENDER_UUID,
    });

    expect(result.isError).toBeFalsy();
    expect(createCampaign).toHaveBeenCalledWith({
      name: "Launch",
      channel: "email",
      template_id: TEMPLATE_UUID,
      recipient_group_ids: [GROUP_UUID],
      sender_address_id: SENDER_UUID,
    });
  });

  it("omits sender_address_id entirely when not supplied, so the backend applies the tenant default", async () => {
    const createCampaign = vi.fn(async () => ({ id: "c1" }));
    const mock = register(createCampaign);

    await mock.lastHandler()({
      name: "Launch",
      channel: "email",
      template_id: TEMPLATE_UUID,
    });

    // Not merely undefined -- the key must be absent, or the backend cannot
    // distinguish "use my default" from "I explicitly sent nothing".
    const sent = createCampaign.mock.calls[0]![0] as Record<string, unknown>;
    expect("sender_address_id" in sent).toBe(false);
  });
});

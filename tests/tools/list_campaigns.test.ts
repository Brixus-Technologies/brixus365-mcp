import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerListCampaignsTool } from "../../src/tools/list_campaigns.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(listCampaigns: BrixusClient["listCampaigns"]): BrixusClient {
  return { listCampaigns } as unknown as BrixusClient;
}

describe("brixus_list_campaigns handler", () => {
  it("happy path returns campaigns list", async () => {
    const mock = makeMockServer();
    const payload = {
      items: [{ id: "uuid-1", name: "Spring Sale", status: "sent" }],
      total: 1,
      page: 1,
      limit: 20,
    };
    const listCampaigns = vi.fn(async () => payload);
    registerListCampaignsTool(
      mock as unknown as Parameters<typeof registerListCampaignsTool>[0],
      makeFakeClient(listCampaigns),
    );
    const result = await mock.lastHandler()({ status: "sent" });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.total).toBe(1);
  });

  it("scope_required error surfaces with fix hint", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(403, {
      error: {
        code: "scope_required",
        message: "Missing permission.",
        type: "auth",
        details: { required_scope: "marketing:campaigns:read" },
      },
    });
    const listCampaigns = vi.fn(async () => { throw err; });
    registerListCampaignsTool(
      mock as unknown as Parameters<typeof registerListCampaignsTool>[0],
      makeFakeClient(listCampaigns),
    );
    const result = await mock.lastHandler()({});
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("scope_required");
    expect(result.content[0]!.text).toContain("marketing:campaigns:read");
    expect(result.content[0]!.text).toContain("marketing:read");
    expect(result.content[0]!.text).toContain("api-keys");
  });

  it("forwards filter params to client", async () => {
    const mock = makeMockServer();
    const listCampaigns = vi.fn(async () => ({ items: [], total: 0 }));
    registerListCampaignsTool(
      mock as unknown as Parameters<typeof registerListCampaignsTool>[0],
      makeFakeClient(listCampaigns),
    );
    await mock.lastHandler()({
      status: "draft",
      channel: "email",
      search: "sale",
      page: 2,
      limit: 10,
    });
    expect(listCampaigns).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft", channel: "email", search: "sale", page: 2 }),
    );
  });
});

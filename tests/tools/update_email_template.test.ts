import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerUpdateEmailTemplateTool } from "../../src/tools/update_email_template.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

function makeFakeClient(overrides: Partial<BrixusClient>): BrixusClient {
  return {
    getDashboardBaseUrl: () => "https://app.brixus365.com",
    ...overrides,
  } as unknown as BrixusClient;
}

const TEMPLATE_UUID = "aaaabbbb-cccc-dddd-eeee-ffffffffffff";

describe("brixus_update_email_template handler", () => {
  it("happy path returns updated template with editor URL", async () => {
    const mock = makeMockServer();
    const updateTemplate = vi.fn(async () => ({
      id: TEMPLATE_UUID,
      name: "Updated Email",
      subject: "New subject",
      variables: [],
      updatedAt: "2026-01-02T00:00:00Z",
    }));
    registerUpdateEmailTemplateTool(
      mock as unknown as Parameters<typeof registerUpdateEmailTemplateTool>[0],
      makeFakeClient({ updateTemplate }),
    );
    const result = await mock.lastHandler()({
      template_id: TEMPLATE_UUID,
      subject: "New subject",
    });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.id).toBe(TEMPLATE_UUID);
    expect(result.structuredContent?.editorUrl).toContain(TEMPLATE_UUID);
    expect(result.structuredContent?.editorUrl).toContain("/apps/marketing/templates/");
    expect(updateTemplate).toHaveBeenCalledWith(TEMPLATE_UUID, {
      subject: "New subject",
      puck_data: undefined,
      name: undefined,
    });
  });

  it("passes puck_data update through to client", async () => {
    const mock = makeMockServer();
    const newPuck = { root: { props: { title: "V2" } }, content: [], zones: {} };
    const updateTemplate = vi.fn(async () => ({
      id: TEMPLATE_UUID,
      name: "Email",
      subject: "S",
      variables: [],
      updatedAt: "2026-01-02T00:00:00Z",
    }));
    registerUpdateEmailTemplateTool(
      mock as unknown as Parameters<typeof registerUpdateEmailTemplateTool>[0],
      makeFakeClient({ updateTemplate }),
    );
    await mock.lastHandler()({
      template_id: TEMPLATE_UUID,
      puck_data: newPuck,
    });
    expect(updateTemplate.mock.calls[0]![1].puck_data).toEqual(newPuck);
  });

  it("template not found surfaces as isError", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(404, {
      error: { code: "template_not_found", message: "Not found", type: "not_found" },
    });
    const updateTemplate = vi.fn(async () => { throw err; });
    registerUpdateEmailTemplateTool(
      mock as unknown as Parameters<typeof registerUpdateEmailTemplateTool>[0],
      makeFakeClient({ updateTemplate }),
    );
    const result = await mock.lastHandler()({
      template_id: TEMPLATE_UUID,
      name: "X",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("template_not_found");
  });
});

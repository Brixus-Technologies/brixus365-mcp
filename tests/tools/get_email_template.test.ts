import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerGetEmailTemplateTool } from "../../src/tools/get_email_template.js";

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

const SAMPLE_PUCK_DATA = {
  root: { props: { title: "Test" } },
  content: [{ type: "EmailContainer", props: { id: "c1" } }],
  zones: { "c1:content": [] },
};

describe("brixus_get_email_template handler", () => {
  it("happy path returns template with template data and editor URL", async () => {
    const mock = makeMockServer();
    const getTemplate = vi.fn(async () => ({
      id: TEMPLATE_UUID,
      name: "Welcome",
      subject: "Hi {{first_name}}",
      category: "marketing",
      variables: ["first_name"],
      puckData: SAMPLE_PUCK_DATA,
    }));
    registerGetEmailTemplateTool(
      mock as unknown as Parameters<typeof registerGetEmailTemplateTool>[0],
      makeFakeClient({ getTemplate }),
    );
    const result = await mock.lastHandler()({ template_id: TEMPLATE_UUID });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.id).toBe(TEMPLATE_UUID);
    expect(result.structuredContent?.templateData).toEqual(SAMPLE_PUCK_DATA);
    expect(result.structuredContent?.editorUrl).toContain(TEMPLATE_UUID);
    expect(result.structuredContent?.editorUrl).toContain("/apps/marketing/templates/");
    expect(getTemplate).toHaveBeenCalledWith(TEMPLATE_UUID);
  });

  it("template not found surfaces as isError", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(404, {
      error: { code: "template_not_found", message: "Not found", type: "not_found" },
    });
    const getTemplate = vi.fn(async () => { throw err; });
    registerGetEmailTemplateTool(
      mock as unknown as Parameters<typeof registerGetEmailTemplateTool>[0],
      makeFakeClient({ getTemplate }),
    );
    const result = await mock.lastHandler()({ template_id: TEMPLATE_UUID });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("template_not_found");
  });
});

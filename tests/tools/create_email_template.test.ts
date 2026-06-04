import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerCreateEmailTemplateTool } from "../../src/tools/create_email_template.js";

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
  zones: {},
};

describe("brixus_create_email_template handler", () => {
  it("happy path returns template id and editor URL", async () => {
    const mock = makeMockServer();
    const createTemplate = vi.fn(async () => ({
      id: TEMPLATE_UUID,
      name: "Welcome Email",
      subject: "Hello {{first_name}}",
      variables: ["first_name"],
      createdAt: "2026-01-01T00:00:00Z",
    }));
    registerCreateEmailTemplateTool(
      mock as unknown as Parameters<typeof registerCreateEmailTemplateTool>[0],
      makeFakeClient({ createTemplate }),
    );
    const result = await mock.lastHandler()({
      name: "Welcome Email",
      subject: "Hello {{first_name}}",
      puck_data: SAMPLE_PUCK_DATA,
    });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.id).toBe(TEMPLATE_UUID);
    expect(result.structuredContent?.editorUrl).toContain(TEMPLATE_UUID);
    expect(result.structuredContent?.editorUrl).toContain("/apps/marketing/templates/");
    expect(createTemplate).toHaveBeenCalledWith({
      name: "Welcome Email",
      subject: "Hello {{first_name}}",
      puck_data: SAMPLE_PUCK_DATA,
      category: undefined,
    });
  });

  it("passes category through to client", async () => {
    const mock = makeMockServer();
    const createTemplate = vi.fn(async () => ({
      id: TEMPLATE_UUID,
      name: "Receipt",
      subject: "Your receipt",
      variables: [],
      createdAt: "2026-01-01T00:00:00Z",
    }));
    registerCreateEmailTemplateTool(
      mock as unknown as Parameters<typeof registerCreateEmailTemplateTool>[0],
      makeFakeClient({ createTemplate }),
    );
    await mock.lastHandler()({
      name: "Receipt",
      subject: "Your receipt",
      puck_data: SAMPLE_PUCK_DATA,
      category: "transactional",
    });
    expect(createTemplate.mock.calls[0]![0].category).toBe("transactional");
  });

  it("API error surfaces as isError", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(403, {
      error: { code: "scope_required", message: "Missing scope", type: "auth" },
    });
    const createTemplate = vi.fn(async () => { throw err; });
    registerCreateEmailTemplateTool(
      mock as unknown as Parameters<typeof registerCreateEmailTemplateTool>[0],
      makeFakeClient({ createTemplate }),
    );
    const result = await mock.lastHandler()({
      name: "X",
      subject: "Y",
      puck_data: SAMPLE_PUCK_DATA,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("scope_required");
  });
});

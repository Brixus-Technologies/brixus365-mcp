import { describe, expect, it, vi } from "vitest";
import { registerGetEmailComponentSchemaTool } from "../../src/tools/get_email_component_schema.js";

type Handler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return { registerTool: register, lastHandler: () => register.mock.calls[0]![2] as Handler };
}

describe("brixus_get_email_component_schema handler", () => {
  it("returns all component schemas when no filter", async () => {
    const mock = makeMockServer();
    registerGetEmailComponentSchemaTool(
      mock as unknown as Parameters<typeof registerGetEmailComponentSchemaTool>[0],
    );
    const result = await mock.lastHandler()({});
    expect(result.isError).toBeFalsy();
    const structured = result.structuredContent!;
    expect(structured.puckDataStructure).toBeDefined();
    expect(structured.minimalExample).toBeDefined();
    const components = structured.components as Record<string, unknown>;
    expect(Object.keys(components).length).toBeGreaterThanOrEqual(15);
    expect(components.EmailContainer).toBeDefined();
    expect(components.EmailButton).toBeDefined();
  });

  it("filters to a single component by name", async () => {
    const mock = makeMockServer();
    registerGetEmailComponentSchemaTool(
      mock as unknown as Parameters<typeof registerGetEmailComponentSchemaTool>[0],
    );
    const result = await mock.lastHandler()({ component_name: "EmailButton" });
    expect(result.isError).toBeFalsy();
    const components = result.structuredContent!.components as Record<string, unknown>;
    expect(Object.keys(components)).toEqual(["EmailButton"]);
  });

  it("returns error for unknown component name", async () => {
    const mock = makeMockServer();
    registerGetEmailComponentSchemaTool(
      mock as unknown as Parameters<typeof registerGetEmailComponentSchemaTool>[0],
    );
    const result = await mock.lastHandler()({ component_name: "FakeComponent" });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Unknown component");
    expect(result.content[0]!.text).toContain("FakeComponent");
  });
});

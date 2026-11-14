import { describe, expect, it, vi } from "vitest";
import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { CreateFormInputSchema } from "../../src/schemas/create_form.js";
import { UpdateFormInputSchema } from "../../src/schemas/update_form.js";
import { registerUpdateFormTool } from "../../src/tools/update_form.js";

type Result = {
  content?: { text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};
type Handler = (args: Record<string, unknown>) => Promise<Result>;

const FORM_UUID = "123e4567-e89b-12d3-a456-426614174000";

function register(client: Partial<BrixusClient>) {
  const registerTool = vi.fn();
  registerUpdateFormTool(
    { registerTool } as unknown as Parameters<typeof registerUpdateFormTool>[0],
    client as BrixusClient,
  );
  const [name, config, handler] = registerTool.mock.calls[0] as [
    string,
    { description: string; inputSchema: unknown },
    Handler,
  ];
  return { name, config, handler };
}

describe("brixus_update_form handler", () => {
  it("is registered under its name with the strict update schema", () => {
    const { name, config } = register({});
    expect(name).toBe("brixus_update_form");
    expect(config.inputSchema).toBe(UpdateFormInputSchema);
  });

  it("passes only the provided fields to client.updateForm", async () => {
    const updateForm = vi.fn(async () => ({ id: FORM_UUID, status: "draft" }));
    const { handler } = register({ updateForm });

    const result = await handler({
      form_id: FORM_UUID,
      name: "Renamed",
      settings: { consent_required: true },
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({ id: FORM_UUID, status: "draft" });
    expect(updateForm).toHaveBeenCalledWith(FORM_UUID, {
      name: "Renamed",
      settings: { consent_required: true },
    });
  });

  it("forwards puck_data on its own", async () => {
    const updateForm = vi.fn(async () => ({ id: FORM_UUID }));
    const { handler } = register({ updateForm });
    await handler({ form_id: FORM_UUID, puck_data: { content: [] } });
    expect(updateForm).toHaveBeenCalledWith(FORM_UUID, { puck_data: { content: [] } });
  });

  it("requires at least one of name, puck_data or settings and does not call the API", async () => {
    const updateForm = vi.fn();
    const { handler } = register({ updateForm });

    const result = await handler({ form_id: FORM_UUID });

    expect(result.isError).toBe(true);
    expect(result.content![0]!.text).toContain("at least one of name, puck_data or settings");
    expect(updateForm).not.toHaveBeenCalled();
  });

  it("maps an API error to an isError result", async () => {
    const updateForm = vi.fn(async () => {
      throw new BrixusApiError(404, {
        error: { code: "form_not_found", message: "Form not found", type: "not_found" },
      });
    });
    const { handler } = register({ updateForm });

    const result = await handler({ form_id: FORM_UUID, name: "x" });

    expect(result.isError).toBe(true);
    expect(result.content![0]!.text).toContain("Form not found");
  });
});

describe("brixus_update_form description", () => {
  const { config } = register({});

  it("states the required scope in the form scopes.test.ts parses", () => {
    expect(config.description).toContain("Requires `forms:write` API key scope.");
  });

  it("says a published form keeps serving its published content until published again", () => {
    expect(config.description).toContain("brixus_publish_form");
    expect(config.description).toContain("keeps serving its published content");
    expect(config.description).toContain("Settings and name changes");
  });
});

describe("UpdateFormInputSchema", () => {
  it("accepts form_id plus any one editable field", () => {
    for (const patch of [
      { name: "x" },
      { puck_data: { content: [] } },
      { settings: { consent_required: true } },
    ]) {
      expect(UpdateFormInputSchema.safeParse({ form_id: FORM_UUID, ...patch }).success).toBe(true);
    }
  });

  it("requires a uuid form_id", () => {
    expect(UpdateFormInputSchema.safeParse({ name: "x" }).success).toBe(false);
    expect(UpdateFormInputSchema.safeParse({ form_id: "nope", name: "x" }).success).toBe(false);
  });

  it("cannot carry status, form_type or anything else (strict)", () => {
    for (const extra of [{ status: "archived" }, { form_type: "hosted" }, { published_data: {} }]) {
      expect(
        UpdateFormInputSchema.safeParse({ form_id: FORM_UUID, name: "x", ...extra }).success,
      ).toBe(false);
    }
  });

  it("reuses the create shapes for name, puck_data and settings", () => {
    const bad = [
      { name: "" },
      { name: "x".repeat(256) },
      { puck_data: "not an object" },
      { settings: { consent_required: "yes" } },
      { settings: { unknown_setting: 1 } },
    ];
    for (const patch of bad) {
      expect(UpdateFormInputSchema.safeParse({ form_id: FORM_UUID, ...patch }).success).toBe(false);
      // The same input is rejected by create too.
      expect(CreateFormInputSchema.safeParse({ name: "ok", ...patch }).success).toBe(false);
    }
  });

  it("keeps field descriptions on the optional name", () => {
    expect(UpdateFormInputSchema.shape.name.description).toContain("New form name");
  });
});

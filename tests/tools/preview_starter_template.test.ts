/**
 * Tests for the brixus_preview_starter_template tool handler.
 */

import { describe, expect, it, vi } from "vitest";

import type { BrixusClient } from "../../src/client.js";
import { CHARACTER_LIMIT } from "../../src/constants.js";
import { BrixusApiError } from "../../src/errors.js";
import { PreviewStarterTemplateInputSchema } from "../../src/schemas/preview_starter_template.js";
import { registerPreviewStarterTemplateTool } from "../../src/tools/preview_starter_template.js";

type Handler = (
  args: Record<string, unknown>,
) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

function makeMockServer() {
  const register = vi.fn();
  return {
    registerTool: register,
    lastHandler: () => register.mock.calls[0]![2] as Handler,
  };
}

describe("brixus_preview_starter_template handler", () => {
  it("returns full HTML when under CHARACTER_LIMIT", async () => {
    const mock = makeMockServer();
    const smallHtml = "<p>" + "a".repeat(500) + "</p>";
    const preview = vi.fn(async () => ({
      slug: "auth-reset",
      subject: "Reset",
      html: smallHtml,
      sampleVariables: { userName: "Alice" },
    }));
    registerPreviewStarterTemplateTool(
      mock as unknown as Parameters<typeof registerPreviewStarterTemplateTool>[0],
      { previewStarterTemplate: preview } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    const result = await handler({ slug: "auth-reset" });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent?.html).toBe(smallHtml);
    expect(result.structuredContent?.truncated).toBeUndefined();
  });

  it("truncates HTML when payload exceeds CHARACTER_LIMIT", async () => {
    const mock = makeMockServer();
    const hugeHtml = "x".repeat(50_000);
    const preview = vi.fn(async () => ({
      slug: "auth-reset",
      subject: "Reset",
      html: hugeHtml,
      sampleVariables: {},
    }));
    registerPreviewStarterTemplateTool(
      mock as unknown as Parameters<typeof registerPreviewStarterTemplateTool>[0],
      { previewStarterTemplate: preview } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    const result = await handler({ slug: "auth-reset" });

    expect(result.structuredContent?.truncated).toBe(true);
    const html = result.structuredContent?.html as string;
    expect(html.startsWith("x".repeat(1000))).toBe(true);
    expect(html).toContain("<!-- [truncated] -->");
  });

  it("forwards variables override to client", async () => {
    const mock = makeMockServer();
    const preview = vi.fn(async () => ({
      slug: "auth-reset",
      subject: "Reset",
      html: "<p>hi</p>",
      sampleVariables: {},
    }));
    registerPreviewStarterTemplateTool(
      mock as unknown as Parameters<typeof registerPreviewStarterTemplateTool>[0],
      { previewStarterTemplate: preview } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    await handler({
      slug: "auth-reset",
      variables: { userName: "Bob" },
    });

    expect(preview).toHaveBeenCalledTimes(1);
    expect(preview.mock.calls[0]![0]).toBe("auth-reset");
    expect(preview.mock.calls[0]![1]).toEqual({ userName: "Bob" });
  });

  it("strips sampleVariables when HTML truncation alone is insufficient", async () => {
    // Regression: a template could embed a huge payload (e.g. base64 image
    // or long product list) in sampleVariables that, even after HTML
    // truncation to 1000 chars, still pushes the serialised output over
    // CHARACTER_LIMIT. The tool must then also strip sampleVariables.
    const mock = makeMockServer();
    const hugeHtml = "x".repeat(50_000);
    const hugeSampleVars = { bigBlob: "y".repeat(30_000) };
    const preview = vi.fn(async () => ({
      slug: "auth-reset",
      subject: "Reset",
      html: hugeHtml,
      sampleVariables: hugeSampleVars,
    }));
    registerPreviewStarterTemplateTool(
      mock as unknown as Parameters<typeof registerPreviewStarterTemplateTool>[0],
      { previewStarterTemplate: preview } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    const result = await handler({ slug: "auth-reset" });

    expect(result.isError).toBeFalsy();
    const text = result.content[0]!.text;
    expect(text.length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    expect(result.structuredContent?.truncated).toBe(true);
    // sampleVariables should be emptied in this path.
    expect(result.structuredContent?.sampleVariables).toEqual({});
    // The truncation note should mention that sampleVariables were stripped
    // so the caller isn't surprised that the data vanished.
    const note = result.structuredContent?.truncationNote as string;
    expect(note).toContain("sampleVariables");
  });

  it("template_not_found maps to 'use brixus_list_starter_templates' hint", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(404, {
      error: {
        code: "template_not_found",
        message: "No template with slug 'ghost'.",
        type: "not_found",
      },
    });
    const preview = vi.fn(async () => {
      throw err;
    });
    registerPreviewStarterTemplateTool(
      mock as unknown as Parameters<typeof registerPreviewStarterTemplateTool>[0],
      { previewStarterTemplate: preview } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    const result = await handler({ slug: "ghost" });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("brixus_list_starter_templates");
  });
});

describe("brixus_preview_starter_template input schema", () => {
  it("rejects slug with uppercase", () => {
    const res = PreviewStarterTemplateInputSchema.safeParse({ slug: "BAD" });
    expect(res.success).toBe(false);
  });

  it("accepts a valid slug without variables", () => {
    const res = PreviewStarterTemplateInputSchema.safeParse({
      slug: "auth-reset",
    });
    expect(res.success).toBe(true);
  });
});

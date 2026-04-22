/**
 * Tests for the brixus_list_starter_templates tool handler.
 */

import { describe, expect, it, vi } from "vitest";

import type { BrixusClient } from "../../src/client.js";
import { BrixusApiError } from "../../src/errors.js";
import { registerListStarterTemplatesTool } from "../../src/tools/list_starter_templates.js";

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

describe("brixus_list_starter_templates handler", () => {
  it("returns structuredContent with templates array", async () => {
    const mock = makeMockServer();
    const list = vi.fn(async () => ({
      templates: [
        {
          slug: "auth-reset",
          name: "Password reset",
          description: "Send a reset link.",
          variables: ["userName", "resetLink"],
        },
        {
          slug: "welcome-email",
          name: "Welcome",
          description: null,
          variables: ["userName"],
        },
      ],
    }));
    registerListStarterTemplatesTool(
      mock as unknown as Parameters<typeof registerListStarterTemplatesTool>[0],
      { listStarterTemplates: list } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    const result = await handler({});

    expect(result.isError).toBeFalsy();
    const templates = result.structuredContent?.templates as unknown[];
    expect(templates).toHaveLength(2);
  });

  it("truncates when payload exceeds CHARACTER_LIMIT", async () => {
    const mock = makeMockServer();
    // 500 templates each with a huge description -> >25kB serialised.
    const bigFiller = "x".repeat(200);
    const rows = Array.from({ length: 500 }, (_, i) => ({
      slug: `tpl-${i}`,
      name: `Template ${i}`,
      description: bigFiller,
      variables: ["a", "b"],
    }));
    const list = vi.fn(async () => ({ templates: rows }));
    registerListStarterTemplatesTool(
      mock as unknown as Parameters<typeof registerListStarterTemplatesTool>[0],
      { listStarterTemplates: list } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    const result = await handler({});

    expect(result.structuredContent?.truncated).toBe(true);
    expect(typeof result.structuredContent?.truncationNote).toBe("string");
    const remaining = result.structuredContent?.templates as unknown[];
    expect(remaining.length).toBeLessThan(500);
  });

  it("surfaces invalid_api_key error verbatim", async () => {
    const mock = makeMockServer();
    const err = new BrixusApiError(401, {
      error: {
        code: "invalid_api_key",
        message: "API key is invalid or revoked.",
        type: "authentication",
      },
    });
    const list = vi.fn(async () => {
      throw err;
    });
    registerListStarterTemplatesTool(
      mock as unknown as Parameters<typeof registerListStarterTemplatesTool>[0],
      { listStarterTemplates: list } as unknown as BrixusClient,
    );
    const handler = mock.lastHandler();
    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Fix: set BRIXUS365_API_KEY");
  });
});

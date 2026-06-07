/**
 * Unit tests for mcp-handler.ts.
 *
 * Tests the createServer function (tool registration) and the
 * McpApiHandler.fetch method (api_key extraction, error response).
 *
 * Cloudflare-only modules are stubbed via vitest.config.ts aliases
 * (cloudflare:workers, agents/mcp).
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { createServer, McpApiHandler } from "../src/mcp-handler.js";
import { BrixusClient } from "../src/client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient(): BrixusClient {
  return new BrixusClient({
    apiKey: "bx_test_key_abc",
    baseUrl: "https://api.example.test/api/v1",
    version: "0.3.0",
    fetchFn: vi.fn(async () =>
      new Response("{}", { status: 200 }),
    ) as unknown as typeof fetch,
  });
}

// ---------------------------------------------------------------------------
// createServer
// ---------------------------------------------------------------------------

describe("createServer", () => {
  it("returns an McpServer instance", () => {
    const server = createServer(makeClient());
    expect(server).toBeInstanceOf(McpServer);
  });

  it("registers exactly 16 tools", () => {
    const spy = vi.spyOn(McpServer.prototype, "registerTool");

    try {
      createServer(makeClient());
      expect(spy).toHaveBeenCalledTimes(16);
    } finally {
      spy.mockRestore();
    }
  });

  it("registers all expected tool names", () => {
    const spy = vi.spyOn(McpServer.prototype, "registerTool");

    try {
      createServer(makeClient());

      const registeredNames = spy.mock.calls.map((call) => call[0]);

      const expectedTools = [
        "brixus_list_starter_templates",
        "brixus_preview_starter_template",
        "brixus_send_email",
        "brixus_get_email",
        "brixus_list_emails",
        "brixus_get_email_analytics",
        "brixus_cancel_email",
        "brixus_send_email_batch",
        "brixus_get_api_key_info",
        "brixus_list_campaigns",
        "brixus_get_campaign",
        "brixus_send_campaign_test",
        "brixus_get_email_component_schema",
        "brixus_create_email_template",
        "brixus_update_email_template",
        "brixus_get_email_template",
      ];

      for (const name of expectedTools) {
        expect(registeredNames).toContain(name);
      }
    } finally {
      spy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// McpApiHandler.fetch — missing api_key
// ---------------------------------------------------------------------------

describe("McpApiHandler.fetch", () => {
  let handler: McpApiHandler;

  beforeEach(() => {
    handler = new McpApiHandler();
    // Simulate the Worker runtime environment
    handler.env = {
      BRIXUS_API_BASE_URL: "https://api.example.test/api/v1",
      BRIXUS_FRONTEND_URL: "https://app.example.test",
      WORKER_URL: "https://mcp.example.test",
      OAUTH_KV: {} as unknown as KVNamespace,
      OAUTH_PROVIDER: {} as unknown as import("@cloudflare/workers-oauth-provider").OAuthHelpers,
      WORKER_SHARED_SECRET: "test-secret",
      OAUTH_STATE_HMAC_SECRET: "test-hmac-secret",
    };
  });

  it("returns 500 JSON response when api_key is missing from ctx.props", async () => {
    // No props on ctx — simulates a token without an api_key
    handler.ctx = {};

    const request = new Request("https://mcp.example.test/mcp", {
      method: "POST",
    });

    const response = await handler.fetch(request);

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const body = (await response.json()) as { error: string; error_description: string };
    expect(body.error).toBe("server_error");
    expect(body.error_description).toContain("missing the API key");
  });

  it("returns 500 when ctx.props exists but api_key is undefined", async () => {
    handler.ctx = { props: {} };

    const request = new Request("https://mcp.example.test/mcp", {
      method: "POST",
    });

    const response = await handler.fetch(request);
    expect(response.status).toBe(500);

    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("server_error");
  });

  it("does not return 500 error when api_key is present in ctx.props", async () => {
    handler.ctx = { props: { api_key: "bx_user_real_key" } };

    const request = new Request("https://mcp.example.test/mcp", {
      method: "POST",
    });

    const response = await handler.fetch(request);

    // Should NOT be the 500 error response for missing api_key.
    // The stub createMcpHandler returns 200, confirming we passed
    // the api_key guard and reached the MCP handler.
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).not.toContain("server_error");
  });
});

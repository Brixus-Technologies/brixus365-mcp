#!/usr/bin/env node
/**
 * Brixus MCP server entry point.
 *
 * Reads BRIXUS365_API_KEY (required) and BRIXUS365_API_BASE_URL (optional) from
 * process.env, constructs a BrixusClient, registers the three tools,
 * and connects over stdio.
 *
 * Run with:   npx @brixus365/mcp-server
 * Or (dev):   npm run dev
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { BrixusClient } from "./client.js";
import { registerSendEmailTool } from "./tools/send_email.js";
import { registerListStarterTemplatesTool } from "./tools/list_starter_templates.js";
import { registerPreviewStarterTemplateTool } from "./tools/preview_starter_template.js";

function readVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(here, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.BRIXUS365_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    // stderr only - never leak config diagnostics to stdout (which is
    // the MCP transport channel).
    console.error(
      "ERROR: BRIXUS365_API_KEY environment variable is required.\n" +
      "Set it in your MCP client config (e.g. claude_desktop_config.json).\n" +
      "Get a key at https://brixus365.com/developers.",
    );
    process.exit(1);
  }

  const version = readVersion();
  const client = new BrixusClient({
    apiKey,
    baseUrl: process.env.BRIXUS365_API_BASE_URL,
    version,
  });

  const server = new McpServer({
    name: "brixus365-mcp-server",
    version,
  });

  registerSendEmailTool(server, client);
  registerListStarterTemplatesTool(server, client);
  registerPreviewStarterTemplateTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Diagnostic ping on stderr only. stdout is reserved for the MCP
  // framing protocol; writing anything else corrupts the session.
  console.error(`brixus365-mcp-server ${version} ready on stdio`);
}

main().catch((err) => {
  console.error("Fatal MCP server error:", err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Brixus MCP server entry point.
 *
 * Reads BRIXUS365_API_KEY (required) and BRIXUS365_API_BASE_URL (optional) from
 * process.env, constructs a BrixusClient, registers all tools, and connects
 * over stdio.
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
import { registerGetEmailTool } from "./tools/get_email.js";
import { registerListEmailsTool } from "./tools/list_emails.js";
import { registerEmailAnalyticsTool } from "./tools/email_analytics.js";
import { registerCancelEmailTool } from "./tools/cancel_email.js";
import { registerSendBatchTool } from "./tools/send_batch.js";
import { registerGetApiKeyInfoTool } from "./tools/get_api_key_info.js";
import { registerListCampaignsTool } from "./tools/list_campaigns.js";
import { registerGetCampaignTool } from "./tools/get_campaign.js";
import { registerSendCampaignTestTool } from "./tools/send_campaign_test.js";
import { registerGetEmailComponentSchemaTool } from "./tools/get_email_component_schema.js";
import { registerCreateEmailTemplateTool } from "./tools/create_email_template.js";
import { registerUpdateEmailTemplateTool } from "./tools/update_email_template.js";
import { registerGetEmailTemplateTool } from "./tools/get_email_template.js";
import { registerListContactsTool } from "./tools/list_contacts.js";
import { registerGetContactTool } from "./tools/get_contact.js";
import { registerGetAudienceStatsTool } from "./tools/get_audience_stats.js";
import { registerCreateContactsTool } from "./tools/create_contacts.js";
import { registerListEmailTemplatesTool } from "./tools/list_email_templates.js";
import { registerListDomainsTool } from "./tools/list_domains.js";
import { registerGetDomainTool } from "./tools/get_domain.js";
import { registerVerifyDomainTool } from "./tools/verify_domain.js";
import { registerListWebhooksTool } from "./tools/list_webhooks.js";
import { registerCreateWebhookTool } from "./tools/create_webhook.js";
import { registerDeleteWebhookTool } from "./tools/delete_webhook.js";
import { registerTestWebhookTool } from "./tools/test_webhook.js";

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

  // Starter templates
  registerListStarterTemplatesTool(server, client);
  registerPreviewStarterTemplateTool(server, client);

  // Transactional email
  registerSendEmailTool(server, client);
  registerGetEmailTool(server, client);
  registerListEmailsTool(server, client);
  registerEmailAnalyticsTool(server, client);
  registerCancelEmailTool(server, client);
  registerSendBatchTool(server, client);

  // API key introspection
  registerGetApiKeyInfoTool(server, client);

  // Marketing campaigns (requires campaigns:read / campaigns:send_test scope)
  registerListCampaignsTool(server, client);
  registerGetCampaignTool(server, client);
  registerSendCampaignTestTool(server, client);

  // Email template editor
  registerGetEmailComponentSchemaTool(server);
  registerCreateEmailTemplateTool(server, client);
  registerUpdateEmailTemplateTool(server, client);
  registerGetEmailTemplateTool(server, client);

  // Contacts
  registerListContactsTool(server, client);
  registerGetContactTool(server, client);
  registerGetAudienceStatsTool(server, client);
  registerCreateContactsTool(server, client);

  // Template listing
  registerListEmailTemplatesTool(server, client);

  // Email domains
  registerListDomainsTool(server, client);
  registerGetDomainTool(server, client);
  registerVerifyDomainTool(server, client);

  // Developer webhooks
  registerListWebhooksTool(server, client);
  registerCreateWebhookTool(server, client);
  registerDeleteWebhookTool(server, client);
  registerTestWebhookTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`brixus365-mcp-server ${version} ready on stdio`);
}

main().catch((err) => {
  console.error("Fatal MCP server error:", err);
  process.exit(1);
});

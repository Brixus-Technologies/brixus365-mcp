/**
 * MCP API handler for authenticated tool requests.
 *
 * OAuthProvider validates the Bearer token before this handler runs.
 * this.ctx.props contains the props from completeAuthorization(),
 * including the api_key.
 *
 * Uses createMcpHandler from agents/mcp for stateless Streamable HTTP.
 */

import { WorkerEntrypoint } from "cloudflare:workers";
import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { Env } from "./worker.js";
import { BrixusClient } from "./client.js";

// Tool registration imports (same as index.ts)
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

function createServer(client: BrixusClient): McpServer {
  const server = new McpServer({
    name: "brixus365-mcp-server",
    version: "0.3.0",
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

  // Marketing campaigns
  registerListCampaignsTool(server, client);
  registerGetCampaignTool(server, client);
  registerSendCampaignTestTool(server, client);

  // Email template editor
  registerGetEmailComponentSchemaTool(server);
  registerCreateEmailTemplateTool(server, client);
  registerUpdateEmailTemplateTool(server, client);
  registerGetEmailTemplateTool(server, client);

  return server;
}

export class McpApiHandler extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    // this.ctx.props contains the props from completeAuthorization()
    const apiKey: string | undefined = (this.ctx as any).props?.api_key;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "server_error",
          error_description:
            "OAuth token is missing the API key. " +
            "Please disconnect and reconnect Brixus365.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create BrixusClient with the user's API key from token props
    const client = new BrixusClient({
      apiKey,
      baseUrl: this.env.BRIXUS_API_BASE_URL,
      version: "0.3.0",
    });

    // Create stateless MCP server and handle the request
    const server = createServer(client);
    const handler = createMcpHandler(server);
    return handler(request, this.env, this.ctx);
  }
}

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
import { registerGetMarketingDashboardTool } from "./tools/get_marketing_dashboard.js";
import { registerGetCampaignEngagementTool } from "./tools/get_campaign_engagement.js";
import { registerGetCampaignLinkPerformanceTool } from "./tools/get_campaign_link_performance.js";
import { registerGetSendingHealthTool } from "./tools/get_sending_health.js";
import { registerCreateCampaignTool } from "./tools/create_campaign.js";
import { registerUpdateCampaignTool } from "./tools/update_campaign.js";
import { registerSendCampaignTool } from "./tools/send_campaign.js";
import { registerPauseCampaignTool } from "./tools/pause_campaign.js";
import { registerResumeCampaignTool } from "./tools/resume_campaign.js";
import { registerListSenderAddressesTool } from "./tools/list_sender_addresses.js";
import { registerListWorkflowsTool } from "./tools/list_workflows.js";
import { registerGetWorkflowTool } from "./tools/get_workflow.js";
import { registerListWorkflowTemplatesTool } from "./tools/list_workflow_templates.js";
import { registerActivateWorkflowTool } from "./tools/activate_workflow.js";
import { registerPauseWorkflowTool } from "./tools/pause_workflow.js";
import { registerDeactivateWorkflowTool } from "./tools/deactivate_workflow.js";
import { registerGetWorkflowAnalyticsTool } from "./tools/get_workflow_analytics.js";
import { registerListOrdersTool } from "./tools/list_orders.js";
import { registerListProductsTool } from "./tools/list_products.js";
import { registerGetCommerceDashboardTool } from "./tools/get_commerce_dashboard.js";
import { registerListAbandonedCartsTool } from "./tools/list_abandoned_carts.js";
import { registerGetRevenueAttributionTool } from "./tools/get_revenue_attribution.js";
import { registerListSegmentsTool } from "./tools/list_segments.js";
import { registerGetSegmentTool } from "./tools/get_segment.js";
import { registerPreviewSegmentTool } from "./tools/preview_segment.js";
import { registerListRecipientGroupsTool } from "./tools/list_recipient_groups.js";
import { registerGetRecipientGroupTool } from "./tools/get_recipient_group.js";

export function createServer(client: BrixusClient): McpServer {
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

  // Marketing analytics
  registerGetMarketingDashboardTool(server, client);
  registerGetCampaignEngagementTool(server, client);
  registerGetCampaignLinkPerformanceTool(server, client);
  registerGetSendingHealthTool(server, client);

  // Campaign management
  registerCreateCampaignTool(server, client);
  registerUpdateCampaignTool(server, client);
  registerSendCampaignTool(server, client);
  registerPauseCampaignTool(server, client);
  registerResumeCampaignTool(server, client);

  // Sender addresses
  registerListSenderAddressesTool(server, client);

  // Workflows (requires workflows:read / workflows:manage scope)
  registerListWorkflowsTool(server, client);
  registerGetWorkflowTool(server, client);
  registerListWorkflowTemplatesTool(server, client);
  registerActivateWorkflowTool(server, client);
  registerPauseWorkflowTool(server, client);
  registerDeactivateWorkflowTool(server, client);
  registerGetWorkflowAnalyticsTool(server, client);

  // Commerce (requires commerce:read scope)
  registerListOrdersTool(server, client);
  registerListProductsTool(server, client);
  registerGetCommerceDashboardTool(server, client);
  registerListAbandonedCartsTool(server, client);
  registerGetRevenueAttributionTool(server, client);

  // Segments (requires marketing:read scope)
  registerListSegmentsTool(server, client);
  registerGetSegmentTool(server, client);
  registerPreviewSegmentTool(server, client);

  // Recipient groups (requires contacts:read scope)
  registerListRecipientGroupsTool(server, client);
  registerGetRecipientGroupTool(server, client);

  return server;
}

export class McpApiHandler extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    // `props` is injected at runtime by OAuthProvider via completeAuthorization(),
    // but the WorkerEntrypoint<Env> type doesn't include it on ctx.
    // Cast to `any` to access the runtime-only property.
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

    // Create stateless MCP server and handle the request.
    // createMcpHandler returns (request, env, ctx) => Response.
    // Pass route: "/" because OAuthProvider already routed us to /mcp —
    // the request.url still contains /mcp but the handler checks pathname
    // against its route option, so we match on "/" to avoid a 404.
    const server = createServer(client);
    const handler = createMcpHandler(server, { route: "/mcp" });

    // Spread ctx to avoid "Illegal invocation" from Workers runtime
    // when the handler accesses ctx methods with a detached `this`.
    const ctx = {
      waitUntil: this.ctx.waitUntil.bind(this.ctx),
      passThroughOnException: this.ctx.passThroughOnException.bind(this.ctx),
      props: (this.ctx as any).props || {},
    };
    return handler(request, this.env, ctx as any);
  }
}

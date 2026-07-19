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
import { registerCreateRecipientGroupTool } from "./tools/create_recipient_group.js";

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
  registerCreateRecipientGroupTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`brixus365-mcp-server ${version} ready on stdio`);
}

main().catch((err) => {
  console.error("Fatal MCP server error:", err);
  process.exit(1);
});

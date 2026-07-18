import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { PauseCampaignInputSchema, type PauseCampaignInput } from "../schemas/pause_campaign.js";

export function registerPauseCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_pause_campaign",
    {
      title: "Pause a sending campaign",
      description: `Pause a campaign that is currently sending.

Recipients already sent to are not affected; remaining recipients are
held until \`brixus_resume_campaign\` is called.

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: PauseCampaignInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: PauseCampaignInput) => {
      try {
        const result = await client.pauseCampaign(params.campaign_id);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: mapToolErrorMessage(error) }],
          isError: true,
        };
      }
    },
  );
}

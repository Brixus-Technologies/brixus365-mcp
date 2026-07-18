import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { ResumeCampaignInputSchema, type ResumeCampaignInput } from "../schemas/resume_campaign.js";

export function registerResumeCampaignTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_resume_campaign",
    {
      title: "Resume a paused campaign",
      description: `Resume sending a campaign that was previously paused.

Sending continues to the remaining, not-yet-sent recipients.

Requires \`marketing:write\` API key scope (Pro/Enterprise tier only).
Use \`brixus_list_campaigns\` to discover campaign IDs.`,
      inputSchema: ResumeCampaignInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ResumeCampaignInput) => {
      try {
        const result = await client.resumeCampaign(params.campaign_id);
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

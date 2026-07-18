import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetAudienceStatsInputSchema, type GetAudienceStatsInput } from "../schemas/get_audience_stats.js";

export function registerGetAudienceStatsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_audience_stats",
    {
      title: "Get audience statistics",
      description: `Retrieve aggregate audience statistics for your Brixus account.

Returns total recipients, email/SMS/WhatsApp subscriber counts,
unsubscribed count, and growth rate percentage.

Requires \`contacts:read\` or \`contacts:write\` API key scope (Free tier and above).`,
      inputSchema: GetAudienceStatsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: GetAudienceStatsInput) => {
      try {
        const result = await client.getAudienceStats();
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

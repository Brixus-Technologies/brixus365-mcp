import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetSendingHealthInputSchema, type GetSendingHealthInput } from "../schemas/get_sending_health.js";

export function registerGetSendingHealthTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_sending_health",
    {
      title: "Get sending health",
      description: `Retrieve email deliverability health for your Brixus account.

Returns a deliverability score along with bounce rate, complaint rate,
and other signals used to detect sending reputation issues.

Requires \`marketing:read\` or \`marketing:write\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: GetSendingHealthInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: GetSendingHealthInput) => {
      try {
        const result = await client.getSendingHealth();
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

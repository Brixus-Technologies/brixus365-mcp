import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetApiKeyInfoInputSchema, type GetApiKeyInfoInput } from "../schemas/get_api_key_info.js";

export function registerGetApiKeyInfoTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_api_key_info",
    {
      title: "Get API key info and usage",
      description: `Retrieve tier, usage counters, rate limits, and allowed send modes for the current API key.

Returns:
  - \`tier\`: account tier (preview / free / pro / enterprise)
  - \`usageToday\` / \`usageMonth\`: emails sent today and this month
  - \`limits\`: daily, monthly, and per-minute rate limits
  - \`allowedModes\`: content modes enabled (e.g. ["starter_template", "template_id", "html"])

Useful for checking remaining quota before sending or diagnosing limit errors.
This endpoint is API-key only and requires no specific scope.`,
      inputSchema: GetApiKeyInfoInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (_params: GetApiKeyInfoInput) => {
      try {
        const result = await client.getApiKeyInfo();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: result as unknown as Record<string, unknown>,
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

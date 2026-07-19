import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetRecipientGroupInputSchema,
  type GetRecipientGroupInput,
} from "../schemas/get_recipient_group.js";

export function registerGetRecipientGroupTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_recipient_group",
    {
      title: "Get recipient group details",
      description: `Retrieve full details for a specific recipient group by ID, including
its member list (first 100 members).

Requires \`contacts:read\` API key scope.
Use \`brixus_list_recipient_groups\` to discover group IDs.`,
      inputSchema: GetRecipientGroupInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetRecipientGroupInput) => {
      try {
        const result = await client.getRecipientGroup(params.group_id);
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

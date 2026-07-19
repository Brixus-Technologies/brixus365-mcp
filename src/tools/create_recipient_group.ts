import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  CreateRecipientGroupInputSchema,
  type CreateRecipientGroupInput,
} from "../schemas/create_recipient_group.js";

export function registerCreateRecipientGroupTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_create_recipient_group",
    {
      title: "Create recipient group",
      description: `Create a new recipient (contact) group in your Brixus account.

Groups are static lists of contacts used for campaign targeting.
Returns the created group with its UUID.

Requires \`contacts:write\` API key scope (Free tier and above).`,
      inputSchema: CreateRecipientGroupInputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateRecipientGroupInput) => {
      try {
        const result = await client.createRecipientGroup(params);
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

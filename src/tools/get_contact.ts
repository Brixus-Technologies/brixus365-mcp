import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetContactInputSchema, type GetContactInput } from "../schemas/get_contact.js";

export function registerGetContactTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_contact",
    {
      title: "Get contact details",
      description: `Retrieve full details for a single contact by UUID.

Returns email, name, phone, subscription status, groups, tags,
custom variables, engagement history, and timestamps.

Requires \`contacts:read\` or \`contacts:write\` API key scope (Free tier and above).`,
      inputSchema: GetContactInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetContactInput) => {
      try {
        const result = await client.getContact(params.contact_id);
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

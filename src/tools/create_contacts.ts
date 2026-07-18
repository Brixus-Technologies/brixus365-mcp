import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { CreateContactsInputSchema, type CreateContactsInput } from "../schemas/create_contacts.js";

export function registerCreateContactsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_create_contacts",
    {
      title: "Create contacts",
      description: `Bulk create (or upsert) contacts in your Brixus audience.

Accepts 1–1000 contacts per call. Each contact needs at least an email
or phone number. Existing contacts (matched by email) are updated.

Optionally assign all contacts to a group by passing \`group_id\`.

Returns counts of total processed, added, and any errors.

Requires \`contacts:write\` API key scope (Free tier and above).`,
      inputSchema: CreateContactsInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: CreateContactsInput) => {
      try {
        const result = await client.createContacts(
          params.contacts,
          params.group_id,
        );
        const text = JSON.stringify(result, null, 2);
        return {
          content: [{
            type: "text" as const,
            text: text.length > CHARACTER_LIMIT
              ? text.slice(0, CHARACTER_LIMIT) + "\n... (response truncated)"
              : text,
          }],
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

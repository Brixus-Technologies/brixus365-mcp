import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListEmailsInputSchema, type ListEmailsInput } from "../schemas/list_emails.js";

export function registerListEmailsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_emails",
    {
      title: "List transactional emails",
      description: `List sent and queued transactional emails with optional filters.

Filter by date range (\`from\`/\`to\`), delivery \`status\`, and paginate with
\`skip\`/\`limit\`. Use \`brixus_get_email\` for full details on a specific message.`,
      inputSchema: ListEmailsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListEmailsInput) => {
      try {
        const result = await client.listEmails({
          ...(params.from && { from: params.from }),
          ...(params.to && { to: params.to }),
          ...(params.status && { status: params.status }),
          ...(params.skip !== undefined && { skip: params.skip }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.sort_by && { sort_by: params.sort_by }),
        });
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

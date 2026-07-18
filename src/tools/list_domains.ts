import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListDomainsInputSchema, type ListDomainsInput } from "../schemas/list_domains.js";

export function registerListDomainsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_domains",
    {
      title: "List email domains",
      description: `List all email domains configured in your Brixus account.

Returns domain name, verification status, DNS records, default flags,
and marketing settings. Use domain IDs with \`brixus_get_domain\` or
\`brixus_verify_domain\`.

Requires \`domains:read\` or \`domains:manage\` API key scope (all tiers).`,
      inputSchema: ListDomainsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (_params: ListDomainsInput) => {
      try {
        const result = await client.listDomains();
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

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetDomainInputSchema, type GetDomainInput } from "../schemas/get_domain.js";

export function registerGetDomainTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_domain",
    {
      title: "Get email domain details",
      description: `Retrieve full details for a single email domain by UUID.

Returns domain name, verification status, DNS records (DKIM, SPF, DMARC),
provider info, reputation score, and configuration flags.

Requires \`domains:read\` or \`domains:manage\` API key scope (all tiers).`,
      inputSchema: GetDomainInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetDomainInput) => {
      try {
        const result = await client.getDomain(params.domain_id);
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

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { VerifyDomainInputSchema, type VerifyDomainInput } from "../schemas/verify_domain.js";

export function registerVerifyDomainTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_verify_domain",
    {
      title: "Verify email domain",
      description: `Trigger DNS verification for an email domain.

Checks that the required DNS records (DKIM, SPF, DMARC) are properly
configured. Returns which records passed, which failed, and any warnings.

Requires \`domains:manage\` API key scope (all tiers).`,
      inputSchema: VerifyDomainInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: VerifyDomainInput) => {
      try {
        const result = await client.verifyDomain(params.domain_id);
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

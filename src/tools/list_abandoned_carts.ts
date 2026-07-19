import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  ListAbandonedCartsInputSchema,
  type ListAbandonedCartsInput,
} from "../schemas/list_abandoned_carts.js";

export function registerListAbandonedCartsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_abandoned_carts",
    {
      title: "List abandoned Shopify carts",
      description: `Browse abandoned checkout data synced from the connected Shopify store.

Returns a paginated list with cart total, item count, and a derived
status ('abandoned', 'converted', or 'recovery_sent').

Requires \`commerce:read\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: ListAbandonedCartsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListAbandonedCartsInput) => {
      try {
        const result = await client.listAbandonedCarts({
          ...(params.page !== undefined && { skip: (params.page - 1) * (params.limit ?? 20) }),
          ...(params.limit !== undefined && { limit: params.limit }),
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

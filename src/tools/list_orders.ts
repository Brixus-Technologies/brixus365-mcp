import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListOrdersInputSchema, type ListOrdersInput } from "../schemas/list_orders.js";

export function registerListOrdersTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_orders",
    {
      title: "List commerce orders",
      description: `Browse recent orders synced from the connected Shopify store.

Returns a paginated list with order number, financial/fulfillment
status, total, and line item count. Requires an active Shopify
integration — returns an empty list if no store is connected.

Requires \`commerce:read\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: ListOrdersInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListOrdersInput) => {
      try {
        const result = await client.listOrders({
          ...(params.page !== undefined && { skip: (params.page - 1) * (params.limit ?? 20) }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.financial_status && { financial_status: params.financial_status }),
          ...(params.fulfillment_status && { fulfillment_status: params.fulfillment_status }),
          ...(params.search && { search: params.search }),
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

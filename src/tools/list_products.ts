import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListProductsInputSchema, type ListProductsInput } from "../schemas/list_products.js";

export function registerListProductsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_products",
    {
      title: "List commerce products",
      description: `Browse products synced from the connected Shopify store.

Returns a paginated list with title, price range, variant count, and
status. Requires an active Shopify integration — returns an empty list
if no store is connected.

Requires \`commerce:read\` API key scope (Pro/Enterprise tier only).`,
      inputSchema: ListProductsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListProductsInput) => {
      try {
        const result = await client.listProducts({
          ...(params.page !== undefined && { skip: (params.page - 1) * (params.limit ?? 20) }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.status && { status: params.status }),
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

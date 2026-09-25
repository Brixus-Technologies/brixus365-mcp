import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import { mapToolErrorMessage } from "../errors.js";
import { ListReportsInputSchema, type ListReportsInput } from "../schemas/list_reports.js";

export function registerListReportsTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_list_reports",
    {
      title: "List generated reports",
      description: `Browse and filter generated reports (CSV/PDF exports of contacts,
campaign recipients, and other data) for your Brixus account.

Returns a paginated list of reports with their source app, type, status,
and creation/expiry timestamps. Use this to discover report IDs for
\`brixus_get_report_download_url\`.

Requires \`contacts:read\` API key scope (also granted by \`contacts:write\`,
\`marketing:read\`, or \`marketing:write\`).

Filter options: source (marketing, workflows, connect), status (pending,
processing, ready, failed, expired).`,
      inputSchema: ListReportsInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: ListReportsInput) => {
      try {
        const result = await client.listReports({
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.source && { source: params.source }),
          ...(params.status && { status: params.status }),
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

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  GetReportDownloadUrlInputSchema,
  type GetReportDownloadUrlInput,
} from "../schemas/get_report_download_url.js";

export function registerGetReportDownloadUrlTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_report_download_url",
    {
      title: "Get a report's download URL",
      description: `Get a fresh pre-signed download URL for a generated report.

Requires \`contacts:read\` API key scope (also granted by \`contacts:write\`,
\`marketing:read\`, or \`marketing:write\`). Use \`brixus_list_reports\` to
discover report IDs.

Possible outcomes:
- The report is ready: returns \`downloadUrl\` (valid for \`expiresInSeconds\`,
  normally 1 hour) and the file can be fetched immediately.
- The report is still pending or processing: the call fails with
  \`report_not_ready\` naming the current status. Wait and retry
  \`brixus_get_report_download_url\` with the same \`report_id\` -- do not
  re-request the report.
- The report expired: files are deleted 7 days after generation. The call
  fails with \`report_expired\`; a new report of the same type must be
  generated.
- The report does not exist for this tenant: the call fails with
  \`report_not_found\` -- double-check the \`report_id\` via
  \`brixus_list_reports\`.`,
      inputSchema: GetReportDownloadUrlInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetReportDownloadUrlInput) => {
      try {
        const result = await client.getReportDownloadUrl(params.report_id);
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

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { CancelEmailInputSchema, type CancelEmailInput } from "../schemas/cancel_email.js";

export function registerCancelEmailTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_cancel_email",
    {
      title: "Cancel a scheduled email",
      description: `Cancel a scheduled transactional email before it is dispatched.

Only emails with status 'scheduled' can be cancelled. Returns a confirmation on success.
Attempting to cancel an already-sent or non-scheduled email returns an error.`,
      inputSchema: CancelEmailInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: CancelEmailInput) => {
      try {
        await client.cancelEmail(params.message_id);
        const output = { success: true, message: "Scheduled email cancelled successfully." };
        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
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

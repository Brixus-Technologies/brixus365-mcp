import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { GetEmailInputSchema, type GetEmailInput } from "../schemas/get_email.js";

export function registerGetEmailTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_get_email",
    {
      title: "Get email delivery status",
      description: `Retrieve the status and details of a transactional email.

\`status\` (queued → sent → delivered / bounced / failed) is for the address in
\`recipientEmail\`. When the email went to several addresses, \`copies\` lists every address
with its own \`status\` and \`messageId\`, To first, then CC, then BCC, and \`groupId\`
identifies the email. Also returns timestamps, subject and the failure reason, if any.

Use the \`messageId\` returned by \`brixus_send_email\` or \`brixus_send_email_batch\`, a
\`failedRecipients[].messageId\`, or an item from \`brixus_list_emails\`.`,
      inputSchema: GetEmailInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (params: GetEmailInput) => {
      try {
        const result = await client.getEmail(params.message_id);
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

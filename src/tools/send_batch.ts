import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrixusClient, BatchMessage } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import { SendBatchInputSchema, type SendBatchInput } from "../schemas/send_batch.js";

export function registerSendBatchTool(server: McpServer, client: BrixusClient): void {
  server.registerTool(
    "brixus_send_email_batch",
    {
      title: "Batch-send transactional emails",
      description: `Send up to 100 transactional emails in a single API call.

Each message in \`messages\` follows the same format as \`brixus_send_email\`:
specify exactly one content mode (starter_template, template_id, or html),
recipient(s), and optional fields.

Limits:
  - Max 100 messages per batch
  - Max 1000 total recipients across all messages

Returns a summary with queued/failed counts and per-message results.`,
      inputSchema: SendBatchInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: SendBatchInput) => {
      const messages: BatchMessage[] = params.messages.map((m) => ({
        to: m.to,
        ...(m.cc && { cc: m.cc }),
        ...(m.bcc && { bcc: m.bcc }),
        ...(m.reply_to && { reply_to: m.reply_to }),
        ...(m.from_name && { from_name: m.from_name }),
        ...(m.from_address && { from_address: m.from_address }),
        ...(m.brand_name && { brand_name: m.brand_name }),
        ...(m.logo_url && { logo_url: m.logo_url }),
        ...(m.starter_template && { starter_template: m.starter_template }),
        ...(m.template_id && { template_id: m.template_id }),
        ...(m.subject && { subject: m.subject }),
        ...(m.html && { html: m.html }),
        ...(m.text && { text: m.text }),
        ...(m.variables && { variables: m.variables }),
        ...(m.attachments && { attachments: m.attachments }),
        ...(m.scheduled_at && { scheduled_at: m.scheduled_at }),
        ...(m.idempotency_key && { idempotency_key: m.idempotency_key }),
      }));
      try {
        const result = await client.sendEmailBatch(messages);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: result as unknown as Record<string, unknown>,
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

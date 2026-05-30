import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { BrixusClient } from "../client.js";
import { mapToolErrorMessage } from "../errors.js";
import {
  SendEmailInputSchema,
  type SendEmailInput,
} from "../schemas/send_email.js";

export function registerSendEmailTool(
  server: McpServer,
  client: BrixusClient,
): void {
  server.registerTool(
    "brixus_send_email",
    {
      title: "Send a transactional email",
      description: `Send a transactional email through Brixus.

Choose exactly one content mode:
  - \`starter_template\` + optional \`variables\`: use a built-in Brixus template
    (call \`brixus_list_starter_templates\` to browse slugs).
  - \`template_id\`: UUID of a custom saved template.
  - \`html\` + required \`subject\`: raw HTML body.

Recipients: \`to\` accepts a single email or an array of up to 50 addresses.
Add \`cc\`, \`bcc\`, or \`reply_to\` as needed.

Scheduling: supply \`scheduled_at\` (ISO 8601, ≤30 days out) to defer delivery.
Deduplication: supply \`idempotency_key\` to safely retry without double-sending.

Returns \`messageId\` (use with \`brixus_get_email\` to check delivery status).`,
      inputSchema: SendEmailInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: SendEmailInput) => {
      const modes = [params.starter_template, params.template_id, params.html].filter(
        Boolean,
      );
      if (modes.length !== 1) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error (invalid_input): Exactly one of `starter_template`, `template_id`, or `html` is required.",
            },
          ],
          isError: true,
        };
      }
      try {
        const resp = await client.sendEmail({
          to: params.to,
          ...(params.cc && { cc: params.cc }),
          ...(params.bcc && { bcc: params.bcc }),
          ...(params.reply_to && { reply_to: params.reply_to }),
          ...(params.from_name && { from_name: params.from_name }),
          ...(params.from_address && { from_address: params.from_address }),
          ...(params.brand_name && { brand_name: params.brand_name }),
          ...(params.logo_url && { logo_url: params.logo_url }),
          ...(params.starter_template && { starter_template: params.starter_template }),
          ...(params.template_id && { template_id: params.template_id }),
          ...(params.subject && { subject: params.subject }),
          ...(params.html && { html: params.html }),
          ...(params.text && { text: params.text }),
          ...(params.variables && { variables: params.variables }),
          ...(params.attachments && { attachments: params.attachments }),
          ...(params.scheduled_at && { scheduled_at: params.scheduled_at }),
          ...(params.idempotency_key && { idempotency_key: params.idempotency_key }),
        });
        const output = {
          messageId: resp.messageId,
          status: resp.status,
          from: resp.from,
        };
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

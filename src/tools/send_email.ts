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
      title: "Send a Brixus transactional email",
      description: `Send a transactional email through Brixus using a starter template.

The email is rendered from the chosen starter template and the variables
you supply. Delivery is asynchronous: this tool returns immediately with
a \`messageId\` and a \`status\` of "queued". Use the Brixus dashboard
to inspect delivery outcomes.

Typical flow for an agent:
  1. Call \`brixus_list_starter_templates\` to find a slug whose \`variables\`
     list matches the data you have.
  2. (Optional) Call \`brixus_preview_starter_template\` with the slug and
     your variables to confirm the rendered subject/body look right.
  3. Call this tool with \`to\`, \`starter_template\`, and \`variables\`.

Args:
  - to (string, required): recipient email address. One recipient per call.
  - starter_template (string, required): kebab-case slug returned by
    \`brixus_list_starter_templates\`.
  - variables (object, optional): key-value pairs to inject. Each
    template documents its required variables.
  - from_name (string, optional): display name, <=1024 chars. Defaults
    to the tenant's configured sender name.

Returns (JSON):
  {
    "messageId": "msg_preview_01J...",   // Brixus message identifier
    "status": "queued",                   // always "queued" on success
    "from": "Alice <noreply@preview.brixus365.com>"
  }

Errors (well-known codes, re-surfaced verbatim):
  - invalid_api_key, missing_api_key: env var not set or wrong.
  - key_revoked_upgrade: preview key revoked post-upgrade; copy the new
    bx_live_ key from the dashboard URL in the error message.
  - upgrade_required: preview limit hit; visit upgrade_url.
  - rate_limit_exceeded, daily_limit_exceeded, monthly_limit_exceeded:
    back off and retry after \`retry_after_seconds\`.
  - template_not_found: call brixus_list_starter_templates first.
  - invalid_recipient, missing_field, multiple_modes: input is malformed.`,
      inputSchema: SendEmailInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,   // sending an email is externally visible
        idempotentHint: false,   // without an idempotency key, two calls = two emails
        openWorldHint: true,
      },
    },
    async (params: SendEmailInput) => {
      try {
        const resp = await client.sendEmail({
          to: params.to,
          starter_template: params.starter_template,
          variables: params.variables,
          from_name: params.from_name,
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

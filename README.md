# Brixus MCP Server

[![npm version](https://img.shields.io/npm/v/@brixus365/mcp-server.svg)](https://www.npmjs.com/package/@brixus365/mcp-server)
[![license](https://img.shields.io/npm/l/@brixus365/mcp-server.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)

A [Model Context Protocol](https://modelcontextprotocol.io) server that
lets LLM agents drive the [Brixus](https://brixus365.com) email platform:
send transactional email, inspect delivery and analytics, cancel scheduled
sends, and run campaign test emails.

## What's included (12 tools)

### Starter templates
- `brixus_list_starter_templates` — enumerate available templates.
- `brixus_preview_starter_template` — render a template for preview.

### Transactional email
- `brixus_send_email` — send a single email (starter template, custom
  template by UUID, or raw HTML). Supports `cc`, `bcc`, `reply_to`, custom
  from address/name, brand name + logo, attachments (up to 10, base64),
  scheduled delivery (≤30 days), and `idempotency_key` for safe retries.
- `brixus_send_email_batch` — send up to 100 transactional emails in a
  single API call (≤1000 total recipients). For one-off transactional
  sends only; use the dashboard for marketing blasts.
- `brixus_get_email` — check delivery status of a message by ID.
- `brixus_list_emails` — browse sent / queued emails with filters
  (status, date range, pagination).
- `brixus_get_email_analytics` — aggregated send stats (sent, delivered,
  opened, clicked, bounced) bucketed by hour or day.
- `brixus_cancel_email` — cancel a scheduled email before dispatch.

### API key introspection
- `brixus_get_api_key_info` — tier, usage today/month, rate limits, and
  allowed send modes for the current key.

### Marketing campaigns
- `brixus_list_campaigns` — browse campaigns with filters and pagination.
- `brixus_get_campaign` — fetch details for a specific campaign.
- `brixus_send_campaign_test` — send a campaign test email to 1–3
  addresses without affecting campaign statistics.

## Required API key scopes

| Tool category | Scope needed | Tier |
|---|---|---|
| Starter templates, transactional email | `emails:send` | All tiers |
| API key introspection | *(no scope required)* | All tiers |
| Marketing campaign reads (`list`, `get`) | `marketing:read` or `marketing:write` | **Pro / Enterprise only** |
| Marketing campaign test send | `marketing:write` | **Pro / Enterprise only** |

`marketing:read` and `marketing:write` are shortcut scopes that resolve
to the underlying RBAC permissions (`marketing:campaigns:read`,
`marketing:campaigns:send`, etc.). Create or update keys at
https://app.brixus365.com/settings/api-keys.

## 1-minute quickstart

1. **Get a Brixus API key.** Sign up at
   https://brixus365.com/developers and copy the `bx_preview_...` (or
   `bx_live_...` after upgrading) key.

2. **Wire it into your MCP client.** The JSON shape below is identical
   across all clients — only the config file location differs.

   <details open>
   <summary><b>Claude Desktop</b> (most common)</summary>

   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
   on macOS (`%APPDATA%\Claude\claude_desktop_config.json` on Windows,
   `~/.config/Claude/claude_desktop_config.json` on Linux). Create the
   file if it doesn't exist:

   ```json
   {
     "mcpServers": {
       "brixus": {
         "command": "npx",
         "args": ["-y", "@brixus365/mcp-server"],
         "env": {
           "BRIXUS365_API_KEY": "bx_preview_REPLACE_ME"
         }
       }
     }
   }
   ```

   Fully quit Claude Desktop (`Cmd+Q` on macOS, right-click → Quit on
   Windows) and reopen. MCP servers only load at startup — closing the
   window doesn't kill the process.
   </details>

   <details>
   <summary><b>Cursor</b></summary>

   Edit `.cursor/mcp.json` in your project root, or `~/.cursor/mcp.json`
   for global config. Same JSON shape as Claude Desktop:

   ```json
   {
     "mcpServers": {
       "brixus": {
         "command": "npx",
         "args": ["-y", "@brixus365/mcp-server"],
         "env": {
           "BRIXUS365_API_KEY": "bx_preview_REPLACE_ME"
         }
       }
     }
   }
   ```

   Fully quit Cursor (`Cmd+Q`) and reopen, or use the *"Reload MCP
   servers"* command from the command palette.
   </details>

   <details>
   <summary><b>Claude Code</b> (CLI)</summary>

   One command — Claude Code edits `~/.claude.json` for you:

   ```bash
   claude mcp add brixus -- env BRIXUS365_API_KEY=bx_preview_REPLACE_ME npx -y @brixus365/mcp-server
   ```

   Verify the server registered:

   ```bash
   claude mcp list
   ```
   </details>

   <details>
   <summary><b>Cline</b> (VS Code extension)</summary>

   Open the command palette → *"Cline: Open MCP Configuration"* and add:

   ```json
   {
     "mcpServers": {
       "brixus": {
         "command": "npx",
         "args": ["-y", "@brixus365/mcp-server"],
         "env": {
           "BRIXUS365_API_KEY": "bx_preview_REPLACE_ME"
         }
       }
     }
   }
   ```

   Click *"Reload"* in the MCP panel after saving.
   </details>

   <details>
   <summary><b>Any other MCP-aware client</b></summary>

   The Brixus MCP server is a pure standard MCP server over stdio. Any
   client that supports the `mcpServers` JSON schema (Continue, Zed,
   Goose, custom clients, etc.) will work — the JSON above is portable.
   The server speaks [MCP spec
   2024-11-05](https://modelcontextprotocol.io/specification/).
   </details>

3. **Restart the client and try a prompt:**

   > Using Brixus, send a password-reset email to `alice@example.com`.
   > The user's first name is Alice and the reset link is
   > `https://example.com/reset/abc123`.

   You can also verify the tools loaded by asking:

   > What Brixus tools do you have access to?

   The agent should enumerate 12 tools (`brixus_send_email`,
   `brixus_list_starter_templates`, etc.). If it doesn't see any, the
   config didn't load — fully quit + restart the client.

## Example prompts

**Discovery and previewing:**
- "List the Brixus starter templates and summarise what each one does."
- "Preview the `welcome-email` template with userName='Bob' and show me
  the subject line."

**Sending:**
- "Send a password-reset email to `bob@example.com` using `auth-reset`
  with resetLink=`https://example.com/reset/xyz`."
- "Send tomorrow at 9am UTC an invoice email to `alice@example.com`
  using `invoice-monthly` with invoiceNumber=1234."
- "Send order-confirmation emails to all 50 customers in this list,
  each with their own order details."

**Monitoring and analytics:**
- "What's the delivery status of message `msg_live_01J...`?"
- "Show me the last 20 emails I sent that bounced."
- "What were my sending stats for the past week, bucketed by day?"
- "Cancel the email scheduled for tonight: `msg_live_01J...`."

**Account introspection:**
- "What tier is my Brixus API key on and how much quota do I have left
  this month?"

**Campaigns (Pro/Enterprise):**
- "List my draft campaigns from the last 30 days."
- "Send a test of campaign `<uuid>` to me and my colleague."

## Configuration

| Env var | Required | Default | Description |
|---|---|---|---|
| `BRIXUS365_API_KEY` | yes | — | Your Brixus API key (`bx_preview_…` or `bx_live_…`). |
| `BRIXUS365_API_BASE_URL` | no | `https://app.brixus365.com/api/v1` | Override for self-hosted or staging environments. |

## Troubleshooting

| Error code | What it means | Fix |
|---|---|---|
| `missing_api_key` / `invalid_api_key` | Env var unset or the value is wrong. | Re-copy the key from https://app.brixus365.com/settings/api-keys. |
| `key_revoked_upgrade` | Your preview key was revoked when the account upgraded. | Copy the new `bx_live_...` key from the dashboard URL in the error message. |
| `upgrade_required` | Preview tier limit hit. | Visit `upgrade_url` from the error message. |
| `rate_limit_exceeded` | Too many calls per minute. | Wait `retry_after_seconds` and retry. |
| `daily_limit_exceeded` / `monthly_limit_exceeded` | You hit your tier's volume cap. | Upgrade or wait for the window to reset. |
| `template_not_found` | The `starter_template` slug is not one of ours. | Call `brixus_list_starter_templates` to see valid slugs. |
| `message_not_found` | Message ID doesn't exist or belongs to a different tenant. | Use `brixus_list_emails` to find valid IDs. |
| `message_already_dispatched` | Tried to cancel an email that's no longer scheduled. | Only emails in `scheduled` status can be cancelled. |
| `attachment_too_large` / `too_many_attachments` / `attachment_type_not_allowed` | Attachment policy violation. | Max 10 files per email; ≤5 MB each; ≤10 MB total. |
| `campaign_not_found` | Campaign ID doesn't exist or belongs to a different tenant. | Use `brixus_list_campaigns` to find valid IDs. |
| `scope_required` | Your API key doesn't grant the permission this tool needs. The error message lists the scopes that would grant it. | Add one of the listed scopes at https://app.brixus365.com/settings/api-keys. Marketing scopes require Pro/Enterprise. |
| `tier_suspended` | The account was auto-suspended for abuse signals. | Email support@brixus365.com. |

## Development

```bash
npm install
npm run build
npm test

# Quick stdio sanity check (will print a one-line ready message on stderr):
BRIXUS365_API_KEY=bx_preview_... node dist/index.js
```

For iterative development:

```bash
BRIXUS365_API_KEY=bx_preview_... npm run dev
```

Or use the MCP Inspector for a richer UI:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Contributing

Bug reports and pull requests welcome at https://github.com/Brixus-Technologies/brixus365-mcp.

## License

MIT © Brixus

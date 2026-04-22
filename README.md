# Brixus MCP Server

[![npm version](https://img.shields.io/npm/v/@brixus365/mcp-server.svg)](https://www.npmjs.com/package/@brixus365/mcp-server)
[![license](https://img.shields.io/npm/l/@brixus365/mcp-server.svg)](./LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) server that
lets LLM agents send transactional email through [Brixus](https://brixus365.com).

Three tools:
- `brixus_send_email` — render a starter template + variables and queue a send.
- `brixus_list_starter_templates` — enumerate available templates.
- `brixus_preview_starter_template` — render a template for preview.

## 1-minute quickstart

1. **Get a Brixus API key.** Sign up at
   https://brixus365.com/developers and copy the `bx_preview_...` (or
   `bx_live_...` after upgrading) key.

2. **Add this server to Claude Desktop.** Open
   `~/Library/Application Support/Claude/claude_desktop_config.json`
   (macOS) or the equivalent on your OS, then add:

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

3. **Restart Claude Desktop.** That's it — try a prompt like:

   > Using Brixus, send a password-reset email to `alice@example.com`.
   > The user's first name is Alice and the reset link is
   > `https://example.com/reset/abc123`.

## Example prompts

- "List the Brixus starter templates and summarise what each one does."
- "Preview the `welcome-email` template with userName='Bob' and show me
  the subject line."
- "Send a password-reset email to `bob@example.com` using
  `auth-reset` with resetLink=`https://example.com/reset/xyz`."

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

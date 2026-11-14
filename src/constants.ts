/**
 * Shared constants for the Brixus MCP server.
 */

export const DEFAULT_API_BASE_URL = "https://app.brixus365.com/api/v1";

/**
 * Scopes the hosted server advertises to OAuth clients. A client can only be
 * granted a scope listed here, so every scope a tool's description says it
 * "Requires" must appear (tests/scopes.test.ts enforces that).
 *
 * Two more lists in the Brixus365 app repo must agree with this one:
 * `MCP_AVAILABLE_SCOPES` (backend/app/api/v1/endpoints/oauth_mcp.py) and the
 * consent page (frontend/src/pages/oauth/consent.tsx), which silently drops
 * any requested scope it does not list.
 */
export const OAUTH_SCOPES = [
  "emails:send",
  "emails:read",
  "marketing:read",
  "marketing:write",
  "templates:read",
  "templates:write",
  "pages:read",
  "pages:write",
  "contacts:read",
  "contacts:write",
  "domains:read",
  "domains:manage",
  "webhooks:read",
  "webhooks:manage",
  "senders:read",
  "workflows:read",
  "workflows:manage",
  "workflows:write",
  "commerce:read",
  "forms:read",
  "forms:write",
];

/**
 * Upper bound on tool-response size (in characters). If a preview HTML
 * payload exceeds this, the tool truncates and returns a message
 * pointing the caller at the full URL via Brixus dashboard.
 *
 * Mirrors the CHARACTER_LIMIT pattern from the mcp-builder skill guide.
 */
export const CHARACTER_LIMIT = 25_000;

/**
 * User-Agent string sent with every Brixus API call. The backend doesn't
 * require it, but a stable identifier makes request-log triage easier
 * when investigating issues like "MCP user hitting rate limit".
 *
 * Format: `brixus365-mcp-server/<version>` (version injected at build time
 * from package.json).
 */
export const USER_AGENT_BASE = "brixus365-mcp-server";

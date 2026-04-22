/**
 * Shared constants for the Brixus MCP server.
 */

export const DEFAULT_API_BASE_URL = "https://app.brixus365.com/api/v1";

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

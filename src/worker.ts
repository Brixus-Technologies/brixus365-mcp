/**
 * Cloudflare Worker entry point for the Brixus365 remote MCP server.
 *
 * Uses OAuthProvider (workers-oauth-provider) as the entrypoint with KV-backed
 * token/client/grant storage. Uses createMcpHandler (agents/mcp) for Streamable
 * HTTP transport.
 *
 * The stdio entry point (src/index.ts) remains unchanged for npm users.
 */

import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { McpApiHandler } from "./mcp-handler.js";
import { oauthDefaultHandler } from "./oauth-handler.js";

export interface Env {
  // KV namespace for OAuth token/client/grant storage (required by workers-oauth-provider)
  OAUTH_KV: KVNamespace;
  // OAuthHelpers injected by the OAuthProvider wrapper
  OAUTH_PROVIDER: OAuthHelpers;

  // Environment variables (set in wrangler.toml [vars])
  BRIXUS_API_BASE_URL: string;
  BRIXUS_FRONTEND_URL: string;
  WORKER_URL: string;

  // Secrets (set via `wrangler secret put`, NOT in wrangler.toml)
  WORKER_SHARED_SECRET: string;
  OAUTH_STATE_HMAC_SECRET: string;
}

export default new OAuthProvider<Env>({
  // MCP tool calls hit /mcp. OAuthProvider validates the Bearer token
  // and forwards to apiHandler with ctx.props populated.
  apiRoute: "/mcp",
  apiHandler: McpApiHandler,

  // Non-API requests (authorization UI, callback) go here.
  defaultHandler: oauthDefaultHandler,

  // OAuth endpoints (implemented by the library)
  authorizeEndpoint: "/oauth/authorize",
  tokenEndpoint: "/oauth/token",
  clientRegistrationEndpoint: "/oauth/register",

  // Token lifetimes
  accessTokenTTL: 3600, // 1 hour
  refreshTokenTTL: 2592000, // 30 days

  // Security
  allowPlainPKCE: false, // S256 only
  allowImplicitFlow: false,

  // Available scopes
  scopesSupported: [
    "emails:send",
    "emails:read",
    "marketing:read",
    "marketing:write",
    "templates:read",
    "templates:write",
  ],
});

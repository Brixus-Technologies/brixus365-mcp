/**
 * Minimal stub for `agents/mcp` so vitest can resolve imports
 * from mcp-handler.ts under Node.js (not the Workers runtime).
 */

export function createMcpHandler(
  _server: unknown,
): (request: Request, env: unknown, ctx: unknown) => Promise<Response> {
  return async () => new Response("stub", { status: 200 });
}

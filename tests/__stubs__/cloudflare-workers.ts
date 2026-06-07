/**
 * Minimal stub for `cloudflare:workers` so vitest can resolve imports
 * from mcp-handler.ts under Node.js (not the Workers runtime).
 */

export class WorkerEntrypoint<_Env = unknown> {
  env: _Env = {} as _Env;
  ctx: unknown = {};

  async fetch(_request: Request): Promise<Response> {
    return new Response("stub", { status: 501 });
  }
}

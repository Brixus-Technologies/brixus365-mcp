import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Virtual modules that only exist in the Cloudflare Workers runtime.
      // Map to local stubs so vitest can resolve them under Node.
      "cloudflare:workers": path.resolve(
        __dirname,
        "tests/__stubs__/cloudflare-workers.ts",
      ),
      "agents/mcp": path.resolve(
        __dirname,
        "tests/__stubs__/agents-mcp.ts",
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});

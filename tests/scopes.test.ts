/**
 * Every scope a tool says it "Requires" must be advertised in OAUTH_SCOPES.
 *
 * A client can only be granted an advertised scope. When forms:* and pages:*
 * tools shipped without their scopes being added to the worker, sign-in
 * succeeded but every one of those tools failed with `scope_required`, and
 * nothing on this side could see it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { OAUTH_SCOPES } from "../src/constants.js";

const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "tools");

/** tool file -> scopes named in its "Requires `a` or `b` API key scope" line. */
function requiredScopesByTool(): Map<string, string[]> {
  const byTool = new Map<string, string[]>();
  for (const file of readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".ts"))) {
    // Descriptions are template literals, so backticks arrive as \` in source.
    const text = readFileSync(join(TOOLS_DIR, file), "utf8").replace(/[`\\]/g, "");
    const scopes = [...text.matchAll(/Requires\s+((?:[a-z]+:[a-z_]+(?:\s+or\s+)?)+)\s+API key scope/g)]
      .flatMap((m) => m[1].match(/[a-z]+:[a-z_]+/g) ?? []);
    if (scopes.length > 0) byTool.set(file, scopes);
  }
  return byTool;
}

describe("OAUTH_SCOPES", () => {
  it("advertises every scope a tool requires", () => {
    const byTool = requiredScopesByTool();
    // An empty parse would make the check below pass for any list.
    expect(byTool.size).toBeGreaterThan(20);

    const advertised = new Set(OAUTH_SCOPES);
    const missing = [...byTool].flatMap(([file, scopes]) =>
      scopes.filter((s) => !advertised.has(s)).map((s) => `${file}: ${s}`),
    );
    expect(missing).toEqual([]);
  });

  it("lists each scope once", () => {
    expect(new Set(OAUTH_SCOPES).size).toBe(OAUTH_SCOPES.length);
  });
});

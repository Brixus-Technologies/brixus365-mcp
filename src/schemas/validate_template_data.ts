/**
 * Guardrails mirroring the dashboard's Puck `verifyBodyHtml` gate.
 *
 * The create/update template API accepts any `puck_data`, but the marketing
 * editor runs `verifyBodyHtml` when a human opens the template and clicks Save,
 * and REJECTS a few font/positioning patterns. Without this check an
 * MCP-authored template can be created via the API yet fail to open cleanly in
 * the editor (a red "Save Changes" state + verification error) — a failure that
 * surfaces to a human days later instead of to the model at author time.
 *
 * We walk the template tree and flag UNAMBIGUOUS problems only (low
 * false-positive):
 *   - a component `styling.fontFamily` that is a bad text or monospace stack,
 *   - `position: absolute` (as a prop or in an inline style string),
 *   - specific bare font-family literals inside inline HTML style strings.
 *
 * We deliberately do NOT enforce the editor's "must contain `-apple-system`
 * somewhere" positive check: a template that omits an explicit `fontFamily`
 * renders fine on the wrapper default yet has no such string in its raw JSON,
 * so flagging that would reject valid templates.
 *
 * Returns a de-duplicated list of failure messages; empty means it passes.
 */

const TEXT_STACK_MSG =
  "must use the system stack `-apple-system, BlinkMacSystemFont, " +
  '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif`. A bare ' +
  "Helvetica/Arial stack renders as 1980s Helvetica on modern devices.";

const MONO_STACK_MSG =
  'must use the explicit stack `"SFMono-Regular", Menlo, Monaco, Consolas, ' +
  '"Liberation Mono", "Courier New", monospace`. A bare or ad-hoc monospace ' +
  "stack renders inconsistently across email clients.";

const ABSOLUTE_MSG =
  "`position: absolute` is not allowed — Gmail strips it and the content " +
  "vanishes. Stack block-level components (EmailText, EmailColumns, " +
  "EmailSection) in document order instead.";

// Tight, anchored patterns for bad literals inside inline HTML style strings.
// No greedy capture group, so they can't over-match across attributes.
const INLINE_BARE_MONO = /font-family\s*:\s*monospace\b/i;
const INLINE_LEGACY_HELVETICA = /font-family\s*:\s*Helvetica,\s*Arial\b/i;
const POSITION_ABSOLUTE = /position\s*:\s*absolute/i;

function fontFamilyFailure(raw: string): string | null {
  const value = raw.toLowerCase();
  if (!value.trim()) return null;
  if (value.includes("monospace")) {
    return value.includes("sfmono-regular")
      ? null
      : `Monospace fontFamily "${raw.trim()}" ${MONO_STACK_MSG}`;
  }
  return value.includes("-apple-system")
    ? null
    : `Text fontFamily "${raw.trim()}" ${TEXT_STACK_MSG}`;
}

export function validateTemplateData(templateData: unknown): string[] {
  const failures = new Set<string>();

  const visit = (node: unknown, key?: string): void => {
    if (typeof node === "string") {
      if (key === "fontFamily") {
        const f = fontFamilyFailure(node);
        if (f) failures.add(f);
      }
      if (POSITION_ABSOLUTE.test(node)) failures.add(ABSOLUTE_MSG);
      if (INLINE_BARE_MONO.test(node))
        failures.add(`Inline \`font-family: monospace\` ${MONO_STACK_MSG}`);
      if (INLINE_LEGACY_HELVETICA.test(node))
        failures.add(`Inline \`font-family: Helvetica, Arial\` ${TEXT_STACK_MSG}`);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === "position" && v === "absolute") failures.add(ABSOLUTE_MSG);
        visit(v, k);
      }
    }
  };

  visit(templateData);
  return [...failures];
}

import { describe, expect, it } from "vitest";
import { validateTemplateData } from "../../src/schemas/validate_template_data.js";

const SYSTEM_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO_STACK =
  '"SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

function textTemplate(fontFamily?: string) {
  return {
    root: { props: { title: "T" } },
    content: [{ type: "EmailContainer", props: { id: "c" } }],
    zones: {
      "c:content": [
        {
          type: "EmailText",
          props: {
            id: "b",
            content: { html: "<p>hi</p>" },
            styling: fontFamily ? { fontFamily } : {},
          },
        },
      ],
    },
  };
}

describe("validateTemplateData", () => {
  it("passes a template with the system font stack", () => {
    expect(validateTemplateData(textTemplate(SYSTEM_STACK))).toEqual([]);
  });

  it("passes a template that declares no fontFamily (relies on renderer default)", () => {
    expect(validateTemplateData(textTemplate())).toEqual([]);
  });

  it("rejects a bare Arial/Helvetica text stack (no -apple-system)", () => {
    const failures = validateTemplateData(
      textTemplate("Arial, Helvetica, sans-serif"),
    );
    expect(failures.length).toBe(1);
    expect(failures[0]).toContain("-apple-system");
  });

  it("rejects a bare `monospace` font-family", () => {
    const failures = validateTemplateData(textTemplate("monospace"));
    expect(failures.some((f) => f.includes("SFMono-Regular"))).toBe(true);
  });

  it("passes the full explicit monospace stack", () => {
    expect(validateTemplateData(textTemplate(MONO_STACK))).toEqual([]);
  });

  it("rejects position: absolute anywhere in the tree", () => {
    const tpl = textTemplate(SYSTEM_STACK) as Record<string, unknown>;
    (tpl as { root: { props: Record<string, unknown> } }).root.props.position =
      "absolute";
    const failures = validateTemplateData(tpl);
    expect(failures.some((f) => f.includes("position: absolute"))).toBe(true);
  });

  it("de-duplicates the same bad stack repeated across atoms", () => {
    const bad = "Arial, Helvetica, sans-serif";
    const tpl = {
      zones: {
        "c:content": [
          { props: { styling: { fontFamily: bad } } },
          { props: { styling: { fontFamily: bad } } },
        ],
      },
    };
    expect(validateTemplateData(tpl).length).toBe(1);
  });

  it("returns nothing for empty / non-object input", () => {
    expect(validateTemplateData(undefined)).toEqual([]);
    expect(validateTemplateData({})).toEqual([]);
  });
});

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  GetEmailComponentSchemaInputSchema,
  type GetEmailComponentSchemaInput,
} from "../schemas/get_email_component_schema.js";

/**
 * Complete Puck email component reference. This is hardcoded — no API call
 * needed. It teaches the LLM exactly how to produce valid Puck JSON for
 * email template creation.
 */
const COMPONENT_SCHEMAS: Record<string, object> = {
  EmailContainer: {
    description: "Outer wrapper for the entire email. Usually one per template, placed in root content[].",
    zones: ["{id}:content"],
    props: {
      styling: {
        backgroundColor: { type: "string", format: "hex color", example: "#ffffff" },
        padding: { type: "number", min: 0, max: 100, default: 20 },
        maxWidth: { type: "number", min: 300, max: 800, default: 600 },
      },
    },
  },
  EmailSection: {
    description: "Horizontal section within a container. Groups content with shared background/padding.",
    zones: ["{id}:section-content"],
    props: {
      styling: {
        backgroundColor: { type: "string", format: "hex color", default: "#f5f5f5" },
        paddingTop: { type: "number", min: 0, max: 100, default: 40 },
        paddingBottom: { type: "number", min: 0, max: 100, default: 40 },
        paddingLeft: { type: "number", min: 0, max: 100, default: 20 },
        paddingRight: { type: "number", min: 0, max: 100, default: 20 },
      },
    },
  },
  EmailHeading: {
    description: "Heading text (h1-h6).",
    zones: [],
    props: {
      content: {
        html: { type: "string", description: "HTML from editor, e.g. '<h2>Title</h2>'" },
        level: { type: "string", enum: ["1", "2", "3", "4", "5", "6"], default: "2" },
      },
      styling: {
        align: { type: "string", enum: ["left", "center", "right"] },
        color: { type: "string", format: "hex color", default: "#333333" },
        fontFamily: { type: "string", optional: true },
      },
    },
  },
  EmailText: {
    description: "Rich text block. Primary content component for paragraphs and inline formatting.",
    zones: [],
    props: {
      content: {
        html: { type: "string", description: "HTML content, e.g. '<p>Hello {{first_name}}</p>'" },
      },
      styling: {
        align: { type: "string", enum: ["left", "center", "right"] },
        color: { type: "string", format: "hex color", default: "#555555" },
        fontSize: { type: "string", default: "16px" },
        fontFamily: { type: "string", optional: true },
        fontWeight: { type: "string", enum: ["normal", "bold", "900"], optional: true },
        letterSpacing: { type: "string", optional: true },
        lineHeight: { type: "string", optional: true },
        backgroundColor: { type: "string", optional: true },
        padding: { type: "number", optional: true },
        borderRadius: { type: "number", optional: true },
        marginBottom: { type: "number", default: 16 },
        displayMode: { type: "string", enum: ["block", "inline-block"], optional: true },
        borderStyle: { type: "string", enum: ["none", "solid", "dashed", "dotted"], optional: true },
        borderWidth: { type: "number", optional: true },
        borderColor: { type: "string", optional: true },
      },
    },
  },
  EmailButton: {
    description: "Call-to-action button with link.",
    zones: [],
    props: {
      content: {
        label: { type: "string", description: "Button text" },
        href: { type: "string", description: "URL the button links to" },
      },
      styling: {
        align: { type: "string", enum: ["left", "center", "right"] },
        backgroundColor: { type: "string", format: "hex color" },
        borderRadius: { type: "number" },
        paddingVertical: { type: "number" },
        paddingHorizontal: { type: "number" },
        borderColor: { type: "string", format: "hex color" },
        borderWidth: { type: "number" },
        width: { type: "string", description: "'auto' or CSS value" },
        textColor: { type: "string", format: "hex color" },
        fontFamily: { type: "string" },
        fontSize: { type: "string" },
        fontStyle: { type: "string" },
      },
    },
  },
  EmailImage: {
    description: "Responsive image with optional link wrapper.",
    zones: [],
    props: {
      content: {
        src: { type: "string", description: "Image URL" },
        alt: { type: "string", description: "Alt text" },
        href: { type: "string", optional: true, description: "Optional link URL" },
      },
      styling: {
        width: { type: "string", default: "100%", description: "'100%', 'auto', or CSS value" },
        height: { type: "string", optional: true },
        align: { type: "string", enum: ["left", "center", "right"] },
        borderRadius: { type: "number", optional: true },
      },
    },
  },
  EmailColumns: {
    description: "Multi-column layout. Children go in zones named {id}:column-0, {id}:column-1, etc.",
    zones: ["{id}:column-0", "{id}:column-1", "...up to {id}:column-{numColumns-1}"],
    props: {
      styling: {
        numColumns: { type: "number", min: 1, max: 6 },
        gap: { type: "number", min: 0, max: 100 },
        columnSizing: { type: "string", enum: ["equal", "fit-content"], optional: true },
        widthTemplate: { type: "string", optional: true, description: "Ratio format: '1:2', '2:1:1'" },
        verticalAlign: { type: "string", enum: ["top", "middle", "bottom"], optional: true },
        columnBackgroundColor: { type: "string", optional: true },
        padding: { type: "number", optional: true },
        borderRadius: { type: "number", optional: true },
        stackOnMobile: { type: "boolean", default: true },
        dividerStyle: { type: "string", enum: ["none", "solid", "dashed", "dotted"], optional: true },
        dividerColor: { type: "string", optional: true },
      },
    },
  },
  EmailHero: {
    description: "Full-width hero image section.",
    zones: [],
    props: {
      content: {
        imageUrl: { type: "string", description: "Hero image URL" },
        imageAlt: { type: "string", description: "Alt text" },
      },
      styling: {
        borderRadius: { type: "number", default: 0 },
        backgroundColor: { type: "string", optional: true },
      },
    },
  },
  EmailDivider: {
    description: "Horizontal divider line.",
    zones: [],
    props: {
      styling: {
        align: { type: "string", enum: ["left", "center", "right"] },
        color: { type: "string", format: "hex color" },
        thickness: { type: "number", min: 1, max: 50 },
        style: { type: "string", enum: ["solid", "dashed", "dotted", "double"] },
        width: { type: "number", min: 0, max: 100, description: "Percentage width" },
        marginTop: { type: "number", min: 0, max: 100 },
        marginBottom: { type: "number" },
      },
    },
  },
  EmailSpacer: {
    description: "Vertical whitespace.",
    zones: [],
    props: {
      styling: {
        height: { type: "number", min: 0, max: 100, default: 20 },
      },
    },
  },
  EmailRawHtml: {
    description: "Raw HTML block. Use sparingly — prefer structured components.",
    zones: [],
    props: {
      html: { type: "string", description: "Raw HTML string" },
    },
  },
  EmailStamp: {
    description: "Circular badge/stamp element.",
    zones: [],
    props: {
      content: {
        text: { type: "string" },
      },
      styling: {
        size: { type: "number", min: 16, max: 80 },
        fillColor: { type: "string", format: "hex color" },
        textColor: { type: "string", format: "hex color" },
        borderColor: { type: "string", format: "hex color" },
        borderWidth: { type: "number", min: 0, max: 6 },
        borderRadius: { type: "number", default: 999 },
        fontFamily: { type: "string" },
        fontSize: { type: "number", min: 8, max: 32 },
        fontWeight: { type: "string", enum: ["normal", "bold", "900"] },
        align: { type: "string", enum: ["left", "center", "right"] },
        marginTop: { type: "number" },
        marginBottom: { type: "number" },
      },
    },
  },
  EmailStarRating: {
    description: "Star rating display (read-only visual).",
    zones: [],
    props: {
      content: {
        rating: { type: "number", min: 0, max: 10 },
        total: { type: "number", min: 1, max: 10 },
      },
      styling: {
        color: { type: "string", format: "hex color" },
        emptyColor: { type: "string", format: "hex color" },
        size: { type: "number", min: 16, max: 64 },
        gap: { type: "number", min: 0, max: 20 },
        align: { type: "string", enum: ["left", "center", "right"] },
        marginTop: { type: "number" },
        marginBottom: { type: "number" },
      },
    },
  },
  EmailSocialButtons: {
    description: "Social media icon links.",
    zones: [],
    props: {
      platforms: {
        type: "array",
        items: {
          id: { type: "string" },
          label: { type: "string" },
          enabled: { type: "boolean" },
          url: { type: "string" },
        },
      },
      styling: {
        align: { type: "string", enum: ["left", "center", "right"] },
        iconStyle: { type: "string" },
        iconSize: { type: "number", min: 16, max: 64 },
        spacing: { type: "number", min: 0, max: 40 },
      },
    },
  },
  EmailTable: {
    description: "Data table. Cell content goes in zones named {id}:column-{index}.",
    zones: ["{id}:column-{index}"],
    props: {
      content: {
        numRows: { type: "number", min: 1, max: 10 },
        numCols: { type: "number", min: 1, max: 6 },
        widthTemplate: { type: "string", optional: true },
      },
      styling: {
        headerRow: { type: "boolean" },
        stripedRows: { type: "boolean" },
        cellPadding: { type: "number", min: 0, max: 50 },
        borderStyle: { type: "string", enum: ["none", "horizontal", "all", "outer"] },
        borderColor: { type: "string", format: "hex color" },
        borderWidth: { type: "number" },
        headerBackgroundColor: { type: "string", format: "hex color" },
        stripedBackgroundColor: { type: "string", format: "hex color" },
      },
    },
  },
  BrixusBrandingFooter: {
    description: "Non-removable Brixus branding footer (free tier). No user-configurable props.",
    zones: [],
    props: {},
  },
};

const PUCK_DATA_STRUCTURE = {
  description: "Top-level Puck data structure for email templates",
  structure: {
    root: { props: { title: "string — email title" } },
    content: "Array of top-level components (usually just one EmailContainer)",
    zones: "Object mapping '{parentId}:{zoneName}' to arrays of child components",
  },
  zoneNamingRules: {
    EmailContainer: "{id}:content",
    EmailSection: "{id}:section-content",
    EmailColumns: "{id}:column-0, {id}:column-1, etc.",
    EmailTable: "{id}:column-{index}",
  },
  idRules: "All IDs must be unique. Use descriptive kebab-case: 'hero-section', 'main-heading', 'cta-button'.",
  variableSyntax: "Use {{variable_name}} in HTML content and subject lines for personalization.",
};

const MINIMAL_EXAMPLE = {
  root: { props: { title: "My Email" } },
  content: [
    {
      type: "EmailContainer",
      props: {
        id: "main-container",
        styling: { maxWidth: 600, padding: 0, backgroundColor: "#ffffff" },
      },
    },
  ],
  zones: {
    "main-container:content": [
      {
        type: "EmailSection",
        props: {
          id: "hero-section",
          styling: {
            backgroundColor: "#f0f4f8",
            paddingTop: 40,
            paddingBottom: 40,
            paddingLeft: 20,
            paddingRight: 20,
          },
        },
      },
      {
        type: "EmailText",
        props: {
          id: "body-text",
          content: {
            html: "<p>Hello {{first_name}},</p><p>Welcome to our newsletter!</p>",
          },
          styling: { align: "left", color: "#555555", fontSize: "16px" },
        },
      },
      {
        type: "EmailButton",
        props: {
          id: "cta-button",
          content: { label: "Get Started", href: "https://example.com" },
          styling: {
            align: "center",
            backgroundColor: "#4F46E5",
            textColor: "#ffffff",
            borderRadius: 6,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderColor: "#4F46E5",
            borderWidth: 0,
            width: "auto",
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            fontStyle: "normal",
          },
        },
      },
    ],
    "hero-section:section-content": [
      {
        type: "EmailHeading",
        props: {
          id: "main-heading",
          content: { html: "<h2>Welcome!</h2>", level: "2" },
          styling: { align: "center", color: "#1a1a1a" },
        },
      },
    ],
  },
};

export function registerGetEmailComponentSchemaTool(server: McpServer): void {
  server.registerTool(
    "brixus_get_email_component_schema",
    {
      title: "Get Puck email component schema reference",
      description: `Returns the complete schema reference for all 16 Puck email components.

Use this BEFORE creating or updating an email template to understand:
- The Puck data structure (root, content, zones)
- Zone naming conventions for each container component
- All component types with their props, types, and defaults
- A minimal working example

Optionally filter by \`component_name\` to get a single component's schema.`,
      inputSchema: GetEmailComponentSchemaInputSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (params: GetEmailComponentSchemaInput) => {
      let components: Record<string, object>;

      if (params.component_name) {
        const schema = COMPONENT_SCHEMAS[params.component_name];
        if (!schema) {
          const validNames = Object.keys(COMPONENT_SCHEMAS).join(", ");
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Unknown component '${params.component_name}'. Valid components: ${validNames}`,
              },
            ],
            isError: true,
          };
        }
        components = { [params.component_name]: schema };
      } else {
        components = COMPONENT_SCHEMAS;
      }

      const result = {
        puckDataStructure: PUCK_DATA_STRUCTURE,
        components,
        minimalExample: MINIMAL_EXAMPLE,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    },
  );
}

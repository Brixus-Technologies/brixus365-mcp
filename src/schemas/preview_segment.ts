import { z } from "zod";

// Mirrors app/schemas/segment.py: SegmentOperator, FieldType, Condition,
// ConditionGroup. `rules` is a recursive tree of conditions combined with
// AND ("all") or OR ("any"); groups can nest inside groups.

const SegmentOperatorEnum = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "greater_than",
  "less_than",
  "between",
  "is_set",
  "is_not_set",
  "in_list",
]);

const FieldTypeEnum = z.enum(["string", "number", "boolean", "date", "tag_list"]);

const ConditionSchema = z.object({
  field: z
    .string()
    .min(1)
    .max(100)
    .describe(
      "Field name to filter on, e.g. 'email', 'total_spent', 'tags'. " +
        "Use the Brixus dashboard's segment builder (GET /marketing/segments/fields) " +
        "to discover valid field names.",
    ),
  operator: SegmentOperatorEnum,
  value: z
    .unknown()
    .optional()
    .describe("Comparison value. Omit for 'is_set' / 'is_not_set' operators."),
  field_type: FieldTypeEnum,
}).strict();

export type ConditionGroupInput = {
  match: "all" | "any";
  conditions: Array<z.infer<typeof ConditionSchema> | ConditionGroupInput>;
};

const ConditionGroupSchema: z.ZodType<ConditionGroupInput> = z.lazy(() =>
  z.object({
    match: z.enum(["all", "any"]),
    conditions: z
      .array(z.union([ConditionSchema, ConditionGroupSchema]))
      .min(1),
  }).strict(),
);

export const PreviewSegmentInputSchema = z.object({
  rules: ConditionGroupSchema.describe(
    "Segment rule tree: a group of conditions combined with AND ('all') or " +
      "OR ('any'). Groups can nest inside groups.",
  ),
}).strict();

export type PreviewSegmentInput = z.infer<typeof PreviewSegmentInputSchema>;

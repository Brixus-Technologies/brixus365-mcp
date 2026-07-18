import { z } from "zod";

const ContactItemSchema = z.object({
  email: z
    .string()
    .email()
    .optional()
    .describe("Contact email address."),
  phone: z
    .string()
    .optional()
    .describe("Contact phone number (E.164 format recommended)."),
  name: z
    .string()
    .max(255)
    .optional()
    .describe("Contact display name."),
  variables: z
    .record(z.string(), z.string())
    .optional()
    .describe("Custom key-value attributes for template personalization."),
});

export const CreateContactsInputSchema = z.object({
  contacts: z
    .array(ContactItemSchema)
    .min(1)
    .max(1000)
    .describe("Array of contacts to create (1–1000). At least email or phone required per contact."),
  group_id: z
    .string()
    .uuid()
    .optional()
    .describe("Optional group UUID to add all contacts to."),
}).strict();

export type CreateContactsInput = z.infer<typeof CreateContactsInputSchema>;

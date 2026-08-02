import { z } from "zod";

// =====================================================
// Form Builder Validation Schemas
// =====================================================

export const formFieldTypeSchema = z.enum([
  "SHORT_TEXT",
  "LONG_TEXT",
  "EMAIL",
  "NUMBER",
  "PHONE",
  "DISCORD_USERNAME",
  "DISCORD_USER_ID",
  "GAME_UID",
  "IGN",
  "SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "RADIO",
  "DATE",
  "TIME",
  "COUNTRY",
  "FILE_UPLOAD",
  "URL",
  "SECTION_HEADER",
  "DIVIDER",
  "PARAGRAPH",
]);

export const formStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const formFieldOptionSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(128, "Label must be at most 128 characters"),
  value: z
    .string()
    .min(1, "Value is required")
    .max(128, "Value must be at most 128 characters"),
});

export const createFormFieldSchema = z.object({
  fieldName: z
    .string()
    .min(2, "Field name must be at least 2 characters")
    .max(64, "Field name must be at most 64 characters")
    .regex(
      /^[a-z_]+$/,
      "Field name must contain only lowercase letters and underscores"
    ),
  label: z
    .string()
    .min(2, "Label must be at least 2 characters")
    .max(128, "Label must be at most 128 characters"),
  fieldType: formFieldTypeSchema,
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  placeholder: z
    .string()
    .max(128, "Placeholder must be at most 128 characters")
    .optional(),
  isRequired: z.boolean().optional().default(false),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  pattern: z
    .string()
    .max(256, "Pattern must be at most 256 characters")
    .optional(),
  defaultValue: z.string().optional(),
  helpText: z
    .string()
    .max(500, "Help text must be at most 500 characters")
    .optional(),
  validationMessage: z
    .string()
    .max(256, "Validation message must be at most 256 characters")
    .optional(),
  displayOrder: z.number().int().min(0).optional().default(0),
  options: z.array(formFieldOptionSchema).optional(),
});

export type CreateFormFieldInput = z.infer<typeof createFormFieldSchema>;

export const updateFormFieldSchema = z.object({
  fieldName: z
    .string()
    .min(2, "Field name must be at least 2 characters")
    .max(64, "Field name must be at most 64 characters")
    .regex(
      /^[a-z_]+$/,
      "Field name must contain only lowercase letters and underscores"
    )
    .optional(),
  label: z
    .string()
    .min(2, "Label must be at least 2 characters")
    .max(128, "Label must be at most 128 characters")
    .optional(),
  fieldType: formFieldTypeSchema.optional(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  placeholder: z
    .string()
    .max(128, "Placeholder must be at most 128 characters")
    .optional(),
  isRequired: z.boolean().optional(),
  minLength: z.number().int().min(0).optional().nullable(),
  maxLength: z.number().int().min(0).optional().nullable(),
  pattern: z
    .string()
    .max(256, "Pattern must be at most 256 characters")
    .optional()
    .nullable(),
  defaultValue: z.string().optional().nullable(),
  helpText: z
    .string()
    .max(500, "Help text must be at most 500 characters")
    .optional()
    .nullable(),
  validationMessage: z
    .string()
    .max(256, "Validation message must be at most 256 characters")
    .optional()
    .nullable(),
  displayOrder: z.number().int().min(0).optional(),
  options: z.array(formFieldOptionSchema).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateFormFieldInput = z.infer<typeof updateFormFieldSchema>;

export const reorderFieldsSchema = z.object({
  fieldOrders: z
    .array(
      z.object({
        id: z.string().uuid("Invalid field ID"),
        displayOrder: z.number().int().min(0),
      })
    )
    .min(1, "At least one field order must be provided"),
});

export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;

export const saveFormVersionSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  fields: z.array(createFormFieldSchema).min(1, "At least one field is required"),
});

export type SaveFormVersionInput = z.infer<typeof saveFormVersionSchema>;

export const submitFormResponseSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  responses: z
    .array(
      z.object({
        fieldName: z.string().min(1, "Field name is required"),
        value: z.string(),
      })
    )
    .min(1, "At least one response is required"),
});

export type SubmitFormResponseInput = z.infer<typeof submitFormResponseSchema>;

export const formResponseFiltersSchema = z.object({
  eventId: z.string().uuid().optional(),
  formFieldId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type FormResponseFiltersInput = z.infer<typeof formResponseFiltersSchema>;

export const exportFormResponsesSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  format: z.enum(["csv", "excel"]),
});

export type ExportFormResponsesInput = z.infer<typeof exportFormResponsesSchema>;

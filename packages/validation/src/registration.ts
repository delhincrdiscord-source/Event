import { z } from "zod";

// =====================================================
// Registration Validation Schemas
// =====================================================

export const registrationStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WAITLISTED",
  "CANCELLED",
  "CHECKED_IN",
  "COMPLETED",
]);

export const createRegistrationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  festivalId: z.string().uuid("Invalid festival ID"),
  eventId: z.string().uuid("Invalid event ID"),
  fullName: z.string().min(2).max(128),
  email: z.string().email().max(255),
  interest: z.string().min(1).max(128),
  discordUsername: z.string().min(2).max(128).optional(),
  responses: z
    .array(
      z.object({
        fieldName: z.string().min(1, "Field name is required"),
        value: z.string(),
      })
    )
    .min(1, "At least one response is required"),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;

export const updateRegistrationSchema = z.object({
  status: registrationStatusSchema.optional(),
  notes: z
    .string()
    .max(5000, "Notes must be at most 5000 characters")
    .optional(),
  cancelReason: z
    .string()
    .max(500, "Cancel reason must be at most 500 characters")
    .optional(),
});

export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;

export const registrationFiltersSchema = z.object({
  search: z.string().optional(),
  festivalId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  status: registrationStatusSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z
    .enum(["registeredAt", "status", "user", "event"])
    .optional()
    .default("registeredAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
});

export type RegistrationFiltersInput = z.infer<typeof registrationFiltersSchema>;

export const bulkRegistrationActionSchema = z.object({
  registrationIds: z
    .array(z.string().uuid())
    .min(1, "At least one registration must be selected"),
});

export type BulkRegistrationActionInput = z.infer<
  typeof bulkRegistrationActionSchema
>;

export const addRegistrationNoteSchema = z.object({
  registrationId: z.string().uuid("Invalid registration ID"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content must be at most 5000 characters"),
  isInternal: z.boolean().optional().default(true),
});

export type AddRegistrationNoteInput = z.infer<typeof addRegistrationNoteSchema>;

export const checkInRegistrationSchema = z.object({
  registrationId: z.string().uuid("Invalid registration ID"),
  method: z.enum(["manual", "qr"]),
});

export type CheckInRegistrationInput = z.infer<typeof checkInRegistrationSchema>;

export const exportRegistrationsSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  format: z.enum(["csv", "excel"]),
  status: registrationStatusSchema.optional(),
});

export type ExportRegistrationsInput = z.infer<typeof exportRegistrationsSchema>;

// =====================================================
// Analytics Validation Schemas
// =====================================================

import { z } from "zod";

export const analyticsFiltersSchema = z.object({
  festivalId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  granularity: z.enum(["hour", "day", "week", "month"]).optional(),
});

export const analyticsExportSchema = z.object({
  format: z.enum(["csv", "excel", "pdf"]),
  filters: analyticsFiltersSchema.optional(),
  dataTypes: z.array(
    z.enum([
      "registrations",
      "events",
      "announcements",
      "notifications",
      "discord",
    ])
  ),
});

export type AnalyticsFiltersInput = z.infer<typeof analyticsFiltersSchema>;
export type AnalyticsExportInput = z.infer<typeof analyticsExportSchema>;

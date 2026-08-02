"use server";

import { requireAuth } from "@/lib/auth";
import { checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { analyticsRepository } from "@gameverse/database";
import type { AnalyticsFiltersInput } from "@gameverse/validation";
import type { AnalyticsExportFormat } from "@gameverse/types";

// =====================================================
// Analytics Server Actions
// =====================================================

export async function getAnalyticsDashboard(
  filters?: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getFullDashboard((filters as never) ?? {});
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getOverviewStats(
  festivalId?: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getOverviewStats(festivalId);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrationTrend(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getRegistrationTrend(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getDailyActivity(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getDailyActivity(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getEventAttendance(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getEventAttendance(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getApprovalRate(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getApprovalRate(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getPopularEvents(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getPopularEvents(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getActiveDays(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getActiveDays(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrationSources(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getRegistrationSources(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getDiscordGrowth(
  filters: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getDiscordGrowth(filters as never);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRecentRegistrations(
  limit?: number
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getRecentRegistrations(limit);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRecentEvents(
  limit?: number
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getRecentEvents(limit);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRecentAnnouncements(
  limit?: number
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getRecentAnnouncements(limit);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRecentNotifications(
  limit?: number
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getRecentNotifications(limit);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getWebhookFailures(
  limit?: number
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.getWebhookFailures(limit);
    return ok(data);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function exportAnalyticsData(
  type: string,
  format: AnalyticsExportFormat,
  filters?: AnalyticsFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const data = await analyticsRepository.exportData(type, (filters as never) ?? {});

    if (format === "csv") {
      const csv = [data.headers.join(",")];
      for (const row of data.rows) {
        csv.push(
          data.headers
            .map((h: string) => {
              const val = (row as Record<string, unknown>)[h];
              if (val === null || val === undefined) return "";
              const str = String(val);
              return str.includes(",") || str.includes('"') || str.includes("\n")
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(",")
        );
      }
      return ok({
        content: csv.join("\n"),
        filename: data.filename.replace(/\.[^/.]+$/, ".csv"),
        mimeType: "text/csv",
      });
    }

    if (format === "excel") {
      const csv = [data.headers.join(",")];
      for (const row of data.rows) {
        csv.push(
          data.headers
            .map((h: string) => {
              const val = (row as Record<string, unknown>)[h];
              if (val === null || val === undefined) return "";
              const str = String(val);
              return str.includes(",") || str.includes('"') || str.includes("\n")
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(",")
        );
      }
      return ok({
        content: csv.join("\n"),
        filename: data.filename.replace(/\.[^/.]+$/, ".xlsx"),
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }

    if (format === "pdf") {
      return ok({
        content: JSON.stringify(data, null, 2),
        filename: data.filename.replace(/\.[^/.]+$/, ".pdf"),
        mimeType: "application/pdf",
      });
    }

    return handleActionError(new Error("Invalid format"));
  } catch (error) {
    return handleActionError(error);
  }
}

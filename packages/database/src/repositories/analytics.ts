import { prisma } from "../client";
import type {
  AnalyticsFilters,
  AnalyticsDashboardData,
  OverviewStats,
  RegistrationTrendData,
  DailyActivityData,
  EventAttendanceData,
  ApprovalRateData,
  PopularEventsData,
  ActiveDaysData,
  RegistrationSourcesData,
  DiscordGrowthData,
  RecentRegistration,
  RecentEvent,
  RecentAnnouncement,
  RecentNotification,
  WebhookFailure,
  AnalyticsExportData,
} from "@gameverse/types";

// =====================================================
// Analytics Repository
// =====================================================

export class AnalyticsRepository {
  async getOverviewStats(festivalId?: string): Promise<OverviewStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const whereClause = festivalId ? { festivalId, isDeleted: false } : { isDeleted: false };

    const [
      activeFestival,
      upcomingEvents,
      todayEvents,
      totalEvents,
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,
      rejectedRegistrations,
      waitlistedRegistrations,
      totalUsers,
      webhookStats,
    ] = await Promise.all([
      prisma.festival.findFirst({
        where: { isActive: true, isDeleted: false },
        select: { id: true, name: true, slug: true, startDate: true, endDate: true, status: true },
      }),
      prisma.communityEvent.count({
        where: { ...whereClause, startDate: { gte: now } },
      }),
      prisma.communityEvent.count({
        where: { ...whereClause, startDate: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.communityEvent.count({
        where: { ...whereClause },
      }),
      prisma.registration.count({ where: festivalId ? { festivalId, isDeleted: false } : { isDeleted: false } }),
      prisma.registration.count({ where: { ...(festivalId ? { festivalId, isDeleted: false } : { isDeleted: false }), status: "PENDING" } }),
      prisma.registration.count({ where: { ...(festivalId ? { festivalId, isDeleted: false } : { isDeleted: false }), status: "APPROVED" } }),
      prisma.registration.count({ where: { ...(festivalId ? { festivalId, isDeleted: false } : { isDeleted: false }), status: "REJECTED" } }),
      prisma.registration.count({ where: { ...(festivalId ? { festivalId, isDeleted: false } : { isDeleted: false }), status: "WAITLISTED" } }),
      prisma.user.count({ where: { deletedAt: null } }),
      Promise.all([
        prisma.discordWebhook.count(),
        prisma.discordAutomation.count({ where: { isActive: true } }),
        prisma.discordWebhookLog.count({
          where: { status: "FAILED", executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
      ]),
    ]);

    const [webhookCount, automationCount, failedWebhookCount] = webhookStats;

    return {
      activeFestival: activeFestival ? {
        id: activeFestival.id,
        name: activeFestival.name,
        slug: activeFestival.slug,
        startDate: activeFestival.startDate,
        endDate: activeFestival.endDate,
        status: activeFestival.status,
      } : null,
      upcomingEvents,
      todayEvents,
      totalEvents,
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,
      rejectedRegistrations,
      waitlistedRegistrations,
      totalMembers: totalUsers,
      discordStatus: {
        botOnline: true,
        totalGuilds: 1,
        totalWebhooks: webhookCount,
        activeAutomations: automationCount,
        webhookFailures: failedWebhookCount,
      },
    };
  }

  async getRegistrationTrend(filters: AnalyticsFilters): Promise<RegistrationTrendData[]> {
    const registrations = await prisma.registration.findMany({
      where: {
        isDeleted: false,
        ...(filters.festivalId ? { festivalId: filters.festivalId } : {}),
      },
      select: { registeredAt: true, status: true },
      orderBy: { registeredAt: "asc" },
    });

    const grouped: Record<string, { approved: number; pending: number; rejected: number; count: number }> = {};
    for (const reg of registrations) {
      const date = reg.registeredAt.toISOString().split("T")[0]!;
      if (!grouped[date]) grouped[date] = { approved: 0, pending: 0, rejected: 0, count: 0 };
      grouped[date]!.count += 1;
      if (reg.status === "APPROVED" || reg.status === "CHECKED_IN") grouped[date]!.approved += 1;
      else if (reg.status === "PENDING") grouped[date]!.pending += 1;
      else if (reg.status === "REJECTED") grouped[date]!.rejected += 1;
    }

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  async getDailyActivity(filters: AnalyticsFilters): Promise<DailyActivityData[]> {
    const [registrations, events, announcements, notifications] = await Promise.all([
      prisma.registration.findMany({ where: { isDeleted: false }, select: { registeredAt: true } }),
      prisma.communityEvent.findMany({ where: { isDeleted: false }, select: { createdAt: true } }),
      prisma.announcement.findMany({ where: { isDeleted: false }, select: { createdAt: true } }),
      prisma.notification.findMany({ select: { createdAt: true } }),
    ]);

    const grouped: Record<string, DailyActivityData> = {};

    for (const reg of registrations) {
      const date = reg.registeredAt.toISOString().split("T")[0]!;
      if (!grouped[date]) grouped[date] = { date, registrations: 0, events: 0, announcements: 0, notifications: 0 };
      grouped[date]!.registrations += 1;
    }

    for (const evt of events) {
      const date = evt.createdAt.toISOString().split("T")[0]!;
      if (!grouped[date]) grouped[date] = { date, registrations: 0, events: 0, announcements: 0, notifications: 0 };
      grouped[date]!.events += 1;
    }

    for (const ann of announcements) {
      const date = ann.createdAt.toISOString().split("T")[0]!;
      if (!grouped[date]) grouped[date] = { date, registrations: 0, events: 0, announcements: 0, notifications: 0 };
      grouped[date]!.announcements += 1;
    }

    for (const notif of notifications) {
      const date = notif.createdAt.toISOString().split("T")[0]!;
      if (!grouped[date]) grouped[date] = { date, registrations: 0, events: 0, announcements: 0, notifications: 0 };
      grouped[date]!.notifications += 1;
    }

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getEventAttendance(filters: AnalyticsFilters): Promise<EventAttendanceData[]> {
    const events = await prisma.communityEvent.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        capacity: true,
        _count: { select: { registrations: true, rsvps: true } },
      },
      take: 10,
    });

    return events.map((evt: { id: string; title: string; capacity: number | null; _count: { registrations: number; rsvps: number } }) => {
      const capacity = evt.capacity;
      const registered = evt._count.registrations;
      const checkedIn = evt._count.rsvps;
      return {
        eventId: evt.id,
        eventTitle: evt.title,
        registered,
        checkedIn,
        capacity,
        attendanceRate: capacity && capacity > 0 ? Math.round((checkedIn / capacity) * 100) : 0,
      };
    });
  }

  async getApprovalRate(filters: AnalyticsFilters): Promise<ApprovalRateData> {
    const [total, approved, rejected, waitlisted, pending] = await Promise.all([
      prisma.registration.count({ where: { isDeleted: false } }),
      prisma.registration.count({ where: { isDeleted: false, status: "APPROVED" } }),
      prisma.registration.count({ where: { isDeleted: false, status: "REJECTED" } }),
      prisma.registration.count({ where: { isDeleted: false, status: "WAITLISTED" } }),
      prisma.registration.count({ where: { isDeleted: false, status: "PENDING" } }),
    ]);

    return {
      total,
      approved,
      rejected,
      waitlisted,
      pending,
      rate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }

  async getPopularEvents(filters: AnalyticsFilters): Promise<PopularEventsData[]> {
    const events = await prisma.communityEvent.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        category: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { registrations: { _count: "desc" } },
      take: 5,
    });

    return events.map((evt: { id: string; title: string; category: { name: string } | null; _count: { registrations: number } }) => ({
      eventId: evt.id,
      eventTitle: evt.title,
      categoryName: evt.category?.name ?? null,
      registrationCount: evt._count.registrations,
    }));
  }

  async getActiveDays(filters: AnalyticsFilters): Promise<ActiveDaysData[]> {
    const registrations = await prisma.registration.findMany({
      where: { isDeleted: false },
      select: { registeredAt: true },
    });

    const dayCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    for (const reg of registrations) {
      const dayName = reg.registeredAt.toLocaleDateString("en-US", { weekday: "long" });
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    }

    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return dayOrder.map((day: string) => ({ day, count: dayCounts[day] ?? 0 }));
  }

  async getRegistrationSources(filters: AnalyticsFilters): Promise<RegistrationSourcesData[]> {
    const registrations = await prisma.registration.findMany({
      where: { isDeleted: false },
      select: { notes: true },
    });

    const sourceCounts: Record<string, number> = {};
    for (const reg of registrations) {
      let source = "Direct";
      if (reg.notes) {
        const notesLower = reg.notes.toLowerCase();
        if (notesLower.includes("discord")) source = "Discord";
        else if (notesLower.includes("twitter") || notesLower.includes("x.com")) source = "Twitter";
        else if (notesLower.includes("instagram")) source = "Instagram";
        else if (notesLower.includes("youtube")) source = "YouTube";
        else if (notesLower.includes("referral")) source = "Referral";
      }
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    }

    const total = registrations.length;
    return Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getDiscordGrowth(filters: AnalyticsFilters): Promise<DiscordGrowthData[]> {
    const accounts = await prisma.discordAccount.findMany({
      select: { syncedAt: true },
      orderBy: { syncedAt: "asc" },
    });

    const grouped: Record<string, { newMembers: number; totalMembers: number; activeMembers: number }> = {};
    let runningTotal = 0;

    for (const account of accounts) {
      const date = account.syncedAt.toISOString().split("T")[0]!;
      if (!grouped[date]) grouped[date] = { newMembers: 0, totalMembers: 0, activeMembers: 0 };
      grouped[date]!.newMembers += 1;
      runningTotal += 1;
      grouped[date]!.totalMembers = runningTotal;
    }

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        ...data,
        activeMembers: Math.round(data.totalMembers * 0.6),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getRecentRegistrations(limit: number = 10): Promise<RecentRegistration[]> {
    const list = await prisma.registration.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        passNumber: true,
        status: true,
        registeredAt: true,
        user: { select: { username: true, email: true, avatarUrl: true } },
        event: { select: { title: true } },
        festival: { select: { name: true } },
      },
      orderBy: { registeredAt: "desc" },
      take: limit,
    });

    return list.map((item: { id: string; passNumber: string; status: string; registeredAt: Date; user: { username: string; email: string; avatarUrl: string | null }; event: { title: string } | null; festival: { name: string } }) => ({
      id: item.id,
      passNumber: item.passNumber,
      status: item.status,
      registeredAt: item.registeredAt,
      user: {
        username: item.user.username,
        email: item.user.email,
        avatarUrl: item.user.avatarUrl,
      },
      event: item.event ? { title: item.event.title } : null,
      festival: { name: item.festival.name },
    }));
  }

  async getRecentEvents(limit: number = 10): Promise<RecentEvent[]> {
    const events = await prisma.communityEvent.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        status: true,
        location: true,
        category: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((evt: { id: string; title: string; slug: string; startDate: Date; endDate: Date; status: string; location: string | null; _count: { registrations: number }; category: { name: string } | null }) => ({
      id: evt.id,
      title: evt.title,
      slug: evt.slug,
      startDate: evt.startDate,
      endDate: evt.endDate,
      status: evt.status,
      location: evt.location,
      _count: evt._count,
      category: evt.category ? { name: evt.category.name } : null,
    }));
  }

  async getRecentAnnouncements(limit: number = 10): Promise<RecentAnnouncement[]> {
    const list = await prisma.announcement.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        priority: true,
        createdAt: true,
        author: { select: { username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return list.map((item: { id: string; title: string; slug: string; status: string; priority: string; createdAt: Date; author: { username: string; avatarUrl: string | null } }) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      priority: item.priority,
      createdAt: item.createdAt,
      author: {
        username: item.author.username,
        avatarUrl: item.author.avatarUrl,
      },
    }));
  }

  async getRecentNotifications(limit: number = 10): Promise<RecentNotification[]> {
    const list = await prisma.notification.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        user: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return list.map((item: { id: string; title: string; type: string; createdAt: Date; user: { username: string } }) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      channel: "IN_APP",
      status: "SENT",
      createdAt: item.createdAt,
      user: { username: item.user.username },
    }));
  }

  async getWebhookFailures(limit: number = 10): Promise<WebhookFailure[]> {
    const logs = await prisma.discordWebhookLog.findMany({
      where: { status: "FAILED" },
      select: {
        id: true,
        webhookId: true,
        status: true,
        statusCode: true,
        errorMessage: true,
        executedAt: true,
        webhook: {
          select: {
            name: true,
            channelId: true,
          },
        },
      },
      orderBy: { executedAt: "desc" },
      take: limit,
    });

    return logs.map((log: { id: string; webhookId: string; status: string; statusCode: number | null; errorMessage: string | null; executedAt: Date; webhook: { name: string; channelId: string } }) => ({
      id: log.id,
      webhookId: log.webhookId,
      status: log.status,
      httpStatus: log.statusCode,
      errorMessage: log.errorMessage,
      attemptCount: 1,
      nextRetryAt: null,
      createdAt: log.executedAt,
      webhook: {
        name: log.webhook.name,
        url: "",
        channel: log.webhook.channelId,
      },
    }));
  }

  async getFullDashboard(filters: AnalyticsFilters): Promise<AnalyticsDashboardData> {
    const [
      overview,
      registrationTrend,
      dailyActivity,
      eventAttendance,
      approvalRate,
      popularEvents,
      activeDays,
      registrationSources,
      discordGrowth,
      recentRegistrations,
      recentEvents,
      recentAnnouncements,
      recentNotifications,
      webhookFailures,
    ] = await Promise.all([
      this.getOverviewStats(filters.festivalId),
      this.getRegistrationTrend(filters),
      this.getDailyActivity(filters),
      this.getEventAttendance(filters),
      this.getApprovalRate(filters),
      this.getPopularEvents(filters),
      this.getActiveDays(filters),
      this.getRegistrationSources(filters),
      this.getDiscordGrowth(filters),
      this.getRecentRegistrations(5),
      this.getRecentEvents(5),
      this.getRecentAnnouncements(5),
      this.getRecentNotifications(5),
      this.getWebhookFailures(5),
    ]);

    return {
      overview,
      registrationTrend,
      dailyActivity,
      eventAttendance,
      approvalRate,
      popularEvents,
      activeDays,
      registrationSources,
      discordGrowth,
      recentRegistrations,
      recentEvents,
      recentAnnouncements,
      recentNotifications,
      webhookFailures,
    };
  }

  async exportData(type: string, filters: AnalyticsFilters): Promise<AnalyticsExportData> {
    switch (type) {
      case "registrations":
        return this.exportRegistrations(filters);
      case "events":
        return this.exportEvents(filters);
      case "announcements":
        return this.exportAnnouncements(filters);
      case "notifications":
        return this.exportNotifications(filters);
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
  }

  private async exportRegistrations(filters: AnalyticsFilters): Promise<AnalyticsExportData> {
    const list = await prisma.registration.findMany({
      where: {
        isDeleted: false,
        ...(filters.festivalId ? { festivalId: filters.festivalId } : {}),
      },
      include: {
        user: { select: { username: true, email: true } },
        festival: { select: { name: true } },
      },
      orderBy: { registeredAt: "desc" },
    });

    return {
      headers: ["ID", "Pass Number", "User", "Email", "Festival", "Status", "Registered At"],
      rows: list.map((r: { id: string; passNumber: string; status: string; registeredAt: Date; user: { username: string; email: string }; festival: { name: string } }) => ({
        ID: r.id,
        "Pass Number": r.passNumber,
        User: r.user.username,
        Email: r.user.email,
        Festival: r.festival.name,
        Status: r.status,
        "Registered At": r.registeredAt.toISOString(),
      })),
      filename: `registrations-${Date.now()}.csv`,
    };
  }

  private async exportEvents(filters: AnalyticsFilters): Promise<AnalyticsExportData> {
    const events = await prisma.communityEvent.findMany({
      where: { isDeleted: false },
      include: {
        category: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return {
      headers: ["ID", "Title", "Category", "Status", "Start Time", "End Time", "RSVPs"],
      rows: events.map((e: { id: string; title: string; category: { name: string }; status: string; startDate: Date; endDate: Date; _count: { registrations: number } }) => ({
        ID: e.id,
        Title: e.title,
        Category: e.category.name,
        Status: e.status,
        "Start Time": e.startDate.toISOString(),
        "End Time": e.endDate.toISOString(),
        RSVPs: e._count.registrations,
      })),
      filename: `events-${Date.now()}.csv`,
    };
  }

  private async exportAnnouncements(filters: AnalyticsFilters): Promise<AnalyticsExportData> {
    const announcements = await prisma.announcement.findMany({
      where: { isDeleted: false },
      include: {
        author: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      headers: ["ID", "Title", "Author", "Published At"],
      rows: announcements.map((a: { id: string; title: string; author: { username: string } | null; publishAt: Date | null; createdAt: Date }) => ({
        ID: a.id,
        Title: a.title,
        Author: a.author?.username ?? "System",
        "Published At": (a.publishAt ?? a.createdAt).toISOString(),
      })),
      filename: `announcements-${Date.now()}.csv`,
    };
  }

  private async exportNotifications(filters: AnalyticsFilters): Promise<AnalyticsExportData> {
    const notifications = await prisma.notification.findMany({
      include: {
        user: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      headers: ["ID", "Title", "Type", "Read", "User", "Created At"],
      rows: notifications.map((n: { id: string; title: string; type: string; isRead: boolean; user: { username: string }; createdAt: Date }) => ({
        ID: n.id,
        Title: n.title,
        Type: n.type,
        Read: n.isRead ? "Yes" : "No",
        User: n.user.username,
        "Created At": n.createdAt.toISOString(),
      })),
      filename: `notifications-${Date.now()}.csv`,
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();

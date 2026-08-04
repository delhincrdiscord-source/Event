"use server";

import { requireAuth } from "@/lib/auth";
import { checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { prisma } from "@gameverse/database";

// =====================================================
// Admin Dashboard Server Actions
// =====================================================

export interface DashboardStats {
  totalParticipants: number;
  totalRegistrations: number;
  activeEvents: number;
  todayEvents: number;
  pendingRegistrations: number;
  completedEvents: number;
  totalPointsAwarded: number;
  onlineParticipants: number;
}

export interface FestivalOverview {
  id: string;
  name: string;
  season: string | null;
  status: string;
  startDate: Date;
  endDate: Date;
  totalEvents: number;
  completedEvents: number;
  remainingEvents: number;
  totalRegistrations: number;
  registrationEnabled: boolean;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  currentDay: number;
  totalDays: number;
}

export interface LiveEvent {
  id: string;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  host: string | null;
  participantCount: number;
  category: { name: string; emoji: string | null } | null;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  startDate: Date;
  endDate: Date;
  bannerUrl: string | null;
  host: string | null;
  registeredCount: number;
  capacity: number | null;
  category: { name: string; emoji: string | null; color: string | null } | null;
  festival: { name: string } | null;
}

export interface ActivityItem {
  id: string;
  type: "REGISTRATION" | "PARTICIPANT" | "ATTENDANCE" | "LEADERBOARD" | "ANNOUNCEMENT" | "EVENT_COMPLETED";
  title: string;
  description: string;
  timestamp: Date;
  meta?: Record<string, unknown>;
}

export interface PendingTask {
  type: "PENDING_REGISTRATIONS" | "PENDING_ANNOUNCEMENTS" | "EVENTS_MISSING_HOSTS" | "EVENTS_STARTING_SOON";
  label: string;
  count: number;
  href: string;
}

export interface DiscordStatus {
  botStatus: string;
  latency: number | null;
  guildName: string | null;
  guildId: string | null;
  announcementChannel: string | null;
  activeAutomations: number;
  totalWebhooks: number;
  webhookFailures: number;
}

export interface SystemHealth {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  redis: "healthy" | "degraded" | "down";
  storage: "healthy" | "degraded" | "down";
  environment: "healthy" | "degraded" | "down";
}

export interface AdminNotification {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  isRead: boolean;
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [
      totalParticipants,
      totalRegistrations,
      activeEvents,
      todayEvents,
      pendingRegistrations,
      completedEvents,
      pointsResult,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.registration.count({ where: { isDeleted: false } }),
      prisma.communityEvent.count({
        where: { isDeleted: false, status: { in: ["PUBLISHED", "LIVE"] } },
      }),
      prisma.communityEvent.count({
        where: {
          isDeleted: false,
          startDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.registration.count({
        where: { isDeleted: false, status: "PENDING" },
      }),
      prisma.communityEvent.count({
        where: { isDeleted: false, status: "COMPLETED" },
      }),
      prisma.pointTransaction.aggregate({
        _sum: { points: true },
        where: { points: { gt: 0 } },
      }).catch(() => ({ _sum: { points: 0 } })),
    ]);

    return ok({
      totalParticipants,
      totalRegistrations,
      activeEvents,
      todayEvents,
      pendingRegistrations,
      completedEvents,
      totalPointsAwarded: (pointsResult as { _sum: { points: number | null } })._sum?.points ?? 0,
      onlineParticipants: 0,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getFestivalOverview(): Promise<ActionResult<FestivalOverview | null>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const festival = await prisma.festival.findFirst({
      where: { isActive: true, isDeleted: false },
      include: {
        _count: {
          select: {
            events: { where: { isDeleted: false } },
            registrations: { where: { isDeleted: false } },
          },
        },
      },
    });

    if (!festival) return ok(null);

    const completedEvents = await prisma.communityEvent.count({
      where: { festivalId: festival.id, isDeleted: false, status: "COMPLETED" },
    });

    const now = new Date();
    const start = new Date(festival.startDate);
    const end = new Date(festival.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const currentDay = Math.max(1, Math.min(totalDays, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));

    const totalEvents = (festival as typeof festival & { _count: { events: number; registrations: number } })._count.events;
    const totalRegistrations = (festival as typeof festival & { _count: { events: number; registrations: number } })._count.registrations;

    return ok({
      id: festival.id,
      name: festival.name,
      season: (festival as Record<string, unknown>).season as string | null ?? null,
      status: festival.status,
      startDate: festival.startDate,
      endDate: festival.endDate,
      totalEvents,
      completedEvents,
      remainingEvents: totalEvents - completedEvents,
      totalRegistrations,
      registrationEnabled: festival.registrationEnabled,
      registrationStart: festival.registrationStart,
      registrationEnd: festival.registrationEnd,
      currentDay,
      totalDays,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getLiveEvents(): Promise<ActionResult<LiveEvent[]>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const events = await prisma.communityEvent.findMany({
      where: { isDeleted: false, status: "LIVE" },
      include: {
        category: { select: { name: true, emoji: true } },
        _count: { select: { registrations: true } },
      },
      take: 3,
      orderBy: { startDate: "asc" },
    });

    return ok(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        host: (e as Record<string, unknown>).host as string | null ?? null,
        participantCount: (e as typeof e & { _count: { registrations: number } })._count.registrations,
        category: e.category ? { name: e.category.name, emoji: e.category.emoji } : null,
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUpcomingEvents(): Promise<ActionResult<UpcomingEvent[]>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const events = await prisma.communityEvent.findMany({
      where: {
        isDeleted: false,
        status: { in: ["PUBLISHED", "UPCOMING"] },
        startDate: { gte: new Date() },
      },
      include: {
        category: { select: { name: true, emoji: true, color: true } },
        festival: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    return ok(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        bannerUrl: e.bannerUrl ?? null,
        host: (e as Record<string, unknown>).host as string | null ?? null,
        registeredCount: (e as typeof e & { _count: { registrations: number } })._count.registrations,
        capacity: e.capacity ?? null,
        category: e.category
          ? { name: e.category.name, emoji: e.category.emoji, color: e.category.color }
          : null,
        festival: e.festival ? { name: e.festival.name } : null,
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRecentActivity(): Promise<ActionResult<ActivityItem[]>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const [recentRegistrations, recentAnnouncements, completedEvents] = await Promise.all([
      prisma.registration.findMany({
        where: { isDeleted: false },
        include: {
          user: { select: { username: true, avatarUrl: true } },
          event: { select: { title: true } },
        },
        orderBy: { registeredAt: "desc" },
        take: 5,
      }),
      prisma.announcement.findMany({
        where: { isDeleted: false },
        include: { author: { select: { username: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.communityEvent.findMany({
        where: { isDeleted: false, status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
    ]);

    const activities: ActivityItem[] = [];

    for (const reg of recentRegistrations) {
      activities.push({
        id: `reg-${reg.id}`,
        type: "REGISTRATION",
        title: "New Registration",
        description: `${reg.user.username} registered for ${reg.event?.title ?? "an event"}`,
        timestamp: reg.registeredAt,
      });
    }

    for (const ann of recentAnnouncements) {
      activities.push({
        id: `ann-${ann.id}`,
        type: "ANNOUNCEMENT",
        title: "Announcement",
        description: ann.title,
        timestamp: ann.createdAt,
      });
    }

    for (const evt of completedEvents) {
      activities.push({
        id: `evt-${evt.id}`,
        type: "EVENT_COMPLETED",
        title: "Event Completed",
        description: `${evt.title} has been completed`,
        timestamp: evt.updatedAt,
      });
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return ok(activities.slice(0, 10));
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getPendingTasks(): Promise<ActionResult<PendingTask[]>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [pendingRegs, pendingAnnouncements, eventsSoon] = await Promise.all([
      prisma.registration.count({ where: { isDeleted: false, status: "PENDING" } }),
      prisma.announcement.count({ where: { isDeleted: false, status: "DRAFT" } }),
      prisma.communityEvent.count({
        where: {
          isDeleted: false,
          status: { in: ["PUBLISHED", "UPCOMING"] },
          startDate: { gte: now, lte: soonThreshold },
        },
      }),
    ]);

    const tasks: PendingTask[] = [
      {
        type: "PENDING_REGISTRATIONS",
        label: "Pending Registrations",
        count: pendingRegs,
        href: "/dashboard/admin/registrations",
      },
      {
        type: "PENDING_ANNOUNCEMENTS",
        label: "Draft Announcements",
        count: pendingAnnouncements,
        href: "/dashboard/admin/announcements",
      },
      {
        type: "EVENTS_STARTING_SOON",
        label: "Events Starting Soon",
        count: eventsSoon,
        href: "/dashboard/admin/events",
      },
    ];

    return ok(tasks);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getDiscordStatus(): Promise<ActionResult<DiscordStatus | null>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const config = await prisma.discordConfig.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        guilds: { take: 1 },
        channels: { where: { channelType: "ANNOUNCEMENT" }, take: 1 },
        automations: { where: { isActive: true } },
        webhooks: true,
      },
    });

    if (!config) return ok(null);

    const failedWebhooks = await prisma.discordWebhookLog.count({
      where: {
        status: "FAILED",
        executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const guild = (config as typeof config & { guilds: Array<{ name: string; guildId: string }> }).guilds?.[0];
    const announcementChannel = (config as typeof config & { channels: Array<{ name: string }> }).channels?.[0];

    return ok({
      botStatus: config.botStatus ?? "OFFLINE",
      latency: config.lastLatency ?? null,
      guildName: guild?.name ?? null,
      guildId: config.guildId,
      announcementChannel: announcementChannel?.name ?? null,
      activeAutomations: (config as typeof config & { automations: unknown[] }).automations?.length ?? 0,
      totalWebhooks: (config as typeof config & { webhooks: unknown[] }).webhooks?.length ?? 0,
      webhookFailures: failedWebhooks,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getSystemHealth(): Promise<ActionResult<SystemHealth>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    // Test DB connectivity
    let dbStatus: "healthy" | "degraded" | "down" = "healthy";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "down";
    }

    const envVars = ["DATABASE_URL", "NEXTAUTH_SECRET"];
    const missingEnv = envVars.filter((v) => !process.env[v]);
    const envStatus: "healthy" | "degraded" | "down" =
      missingEnv.length === 0 ? "healthy" : missingEnv.length < envVars.length ? "degraded" : "down";

    return ok({
      api: "healthy",
      database: dbStatus,
      redis: process.env.REDIS_URL ? "healthy" : "degraded",
      storage: process.env.STORAGE_BUCKET ? "healthy" : "degraded",
      environment: envStatus,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAdminNotifications(): Promise<ActionResult<AdminNotification[]>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        isRead: true,
      },
    });

    return ok(
      notifications.map((n) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        createdAt: n.createdAt,
        isRead: n.isRead,
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}

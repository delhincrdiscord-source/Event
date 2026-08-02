"use server";

import { requireAuth, AuthError } from "@/lib/auth";
import { prisma } from "@gameverse/database";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MyRegistration = {
  id: string;
  passNumber: string;
  status: string;
  fullName: string;
  email: string;
  interest: string;
  discordUsername: string | null;
  discordChannelId: string | null;
  checkedInAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  cancelReason: string | null;
  registeredAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date;
    bannerUrl: string | null;
    thumbnailUrl: string | null;
    location: string | null;
    status: string;
    discordVoiceChannelId: string | null;
    capacity: number | null;
    category: { name: string; emoji: string | null } | null;
  } | null;
  festival: {
    id: string;
    name: string;
    slug: string;
  };
  notesList: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    author: { username: string; avatarUrl: string | null };
  }>;
  timeline: Array<{
    id: string;
    action: string;
    actorName: string | null;
    details: unknown;
    createdAt: Date;
  }>;
};

export type RegistrationFilters = {
  status?: string;
  festivalId?: string;
  categoryId?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "upcoming" | "completed";
  page?: number;
  pageSize?: number;
};

export type PaginatedMyRegistrations = {
  registrations: MyRegistration[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Fetch My Registrations ───────────────────────────────────────────────────

export async function getMyRegistrationsFull(
  filters: RegistrationFilters = {}
): Promise<ActionResult<PaginatedMyRegistrations>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);
    const userId = session.userId;

    const {
      status,
      festivalId,
      search,
      sortBy = "newest",
      page = 1,
      pageSize = 12,
    } = filters;

    // Build where clause
    const where: Record<string, unknown> = {
      userId,
      isDeleted: false,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (festivalId) {
      where.festivalId = festivalId;
    }

    // Search filter
    if (search && search.trim()) {
      where.event = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { category: { name: { contains: search, mode: "insensitive" } } },
        ],
      };
    }

    // Sort order
    let orderBy: Record<string, unknown> = { registeredAt: "desc" };
    if (sortBy === "oldest") orderBy = { registeredAt: "asc" };
    else if (sortBy === "upcoming") orderBy = { event: { startDate: "asc" } };
    else if (sortBy === "completed") orderBy = { event: { endDate: "desc" } };

    const skip = (page - 1) * pageSize;

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          passNumber: true,
          status: true,
          fullName: true,
          email: true,
          interest: true,
          discordUsername: true,
          discordChannelId: true,
          checkedInAt: true,
          approvedAt: true,
          rejectedAt: true,
          cancelReason: true,
          registeredAt: true,
          updatedAt: true,
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
              endDate: true,
              bannerUrl: true,
              thumbnailUrl: true,
              location: true,
              status: true,
              discordVoiceChannelId: true,
              capacity: true,
              category: {
                select: { name: true, emoji: true },
              },
            },
          },
          festival: {
            select: { id: true, name: true, slug: true },
          },
          notesList: {
            where: { isInternal: false },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              content: true,
              isInternal: true,
              createdAt: true,
              author: {
                select: { username: true, avatarUrl: true },
              },
            },
          },
          timeline: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              action: true,
              actorName: true,
              details: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return ok({
      registrations: registrations as MyRegistration[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Registration Summary Stats ───────────────────────────────────────────────

export type RegistrationSummary = {
  total: number;
  upcoming: number;
  pending: number;
  approved: number;
  waitlisted: number;
  rejected: number;
  completed: number;
  cancelled: number;
};

export async function getMyRegistrationSummary(): Promise<ActionResult<RegistrationSummary>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const now = new Date();

    const [all, pending, approved, waitlisted, rejected, completed, cancelled] = await Promise.all([
      prisma.registration.count({ where: { userId, isDeleted: false } }),
      prisma.registration.count({ where: { userId, isDeleted: false, status: "PENDING" } }),
      prisma.registration.count({ where: { userId, isDeleted: false, status: "APPROVED" } }),
      prisma.registration.count({ where: { userId, isDeleted: false, status: "WAITLISTED" } }),
      prisma.registration.count({ where: { userId, isDeleted: false, status: "REJECTED" } }),
      prisma.registration.count({ where: { userId, isDeleted: false, status: { in: ["COMPLETED", "CHECKED_IN"] } } }),
      prisma.registration.count({ where: { userId, isDeleted: false, status: "CANCELLED" } }),
    ]);

    // Upcoming = approved registrations with event in the future
    const upcoming = await prisma.registration.count({
      where: {
        userId,
        isDeleted: false,
        status: { in: ["APPROVED", "PENDING", "WAITLISTED"] },
        event: { startDate: { gte: now } },
      },
    });

    return ok({ total: all, upcoming, pending, approved, waitlisted, rejected, completed, cancelled });
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Cancel Registration ──────────────────────────────────────────────────────

export async function cancelMyRegistration(
  registrationId: string,
  reason?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    await checkMutationRateLimit(session.userId);
    const userId = session.userId;

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, userId, isDeleted: false },
    });

    if (!registration) {
      return handleActionError(new AuthError("NOT_FOUND", "Registration not found"));
    }

    if (["CANCELLED", "COMPLETED", "CHECKED_IN"].includes(registration.status)) {
      return handleActionError(
        new AuthError("VALIDATION_ERROR", "This registration cannot be cancelled")
      );
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: "CANCELLED",
        cancelReason: reason ?? "Cancelled by participant",
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    // Add timeline entry
    await prisma.registrationTimeline.create({
      data: {
        registrationId,
        action: "CANCELLED",
        actorName: "Participant",
        details: { reason: reason ?? "Cancelled by participant" },
      },
    });

    await writeAuditLog({
      actorId: userId,
      action: "REGISTRATION_CANCEL",
      targetEntity: "Registration",
      targetId: registrationId,
      changesJson: { reason: reason ?? "Cancelled by participant" },
    });

    return ok(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Get Festivals for Filter ─────────────────────────────────────────────────

export async function getMyFestivals(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const festivals = await prisma.festival.findMany({
      where: {
        isDeleted: false,
        registrations: { some: { userId, isDeleted: false } },
      },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    });

    return ok(festivals);
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Get Notifications for My Registrations ───────────────────────────────────

export type RegistrationNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
};

export async function getMyRegistrationNotifications(): Promise<ActionResult<RegistrationNotification[]>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isArchived: false,
        type: { in: ["REGISTRATION", "APPROVAL", "REMINDER", "EVENT"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
    });

    return ok(notifications as RegistrationNotification[]);
  } catch (error) {
    return handleActionError(error);
  }
}

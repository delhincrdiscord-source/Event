"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@gameverse/database";


// =====================================================
// Participant Server Actions
// =====================================================

export interface ParticipantFilters {
  search?: string;
  festivalId?: string;
  status?: "ACTIVE" | "SUSPENDED" | "BLACKLISTED" | "ALL";
  registrationStatus?: string;
  page?: number;
  perPage?: number;
  sortBy?: "newest" | "oldest" | "highestPoints" | "lowestPoints" | "mostActive" | "highestAttendance";
}

export interface ParticipantListItem {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  email: string;
  bannedAt: Date | null;
  banReason: string | null;
  createdAt: Date;
  discordAccount: {
    discordUserId: string;
    username: string | null;
    discriminator: string | null;
    avatarUrl: string | null;
  } | null;
  totalPoints: number;
  totalRegistrations: number;
  approvedRegistrations: number;
  festivals: string[];
  status: "ACTIVE" | "SUSPENDED" | "BLACKLISTED";
}

export interface ParticipantStats {
  totalParticipants: number;
  activeParticipants: number;
  newThisWeek: number;
  suspendedParticipants: number;
  avgAttendance: number;
  avgPoints: number;
  mostActiveParticipant: string | null;
  totalWins: number;
}

export interface ParticipantNote {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export async function getParticipants(
  filters: ParticipantFilters
): Promise<ActionResult<{ participants: ParticipantListItem[]; total: number; page: number; perPage: number; totalPages: number }>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const {
      search,
      festivalId,
      status = "ALL",
      page = 1,
      perPage = 20,
      sortBy = "newest",
    } = filters;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { globalName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { discordAccount: { username: { contains: search, mode: "insensitive" } } },
        { discordAccount: { discordUserId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status === "SUSPENDED") {
      where.bannedAt = { not: null };
      where.banReason = { not: "BLACKLISTED" };
    } else if (status === "BLACKLISTED") {
      where.banReason = "BLACKLISTED";
    } else if (status === "ACTIVE") {
      where.bannedAt = null;
    }

    let orderBy: Record<string, unknown> = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as never,
        orderBy: orderBy as never,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          discordAccount: {
            select: {
              discordUserId: true,
              username: true,
              discriminator: true,
              avatarUrl: true,
            },
          },
          registrations: {
            where: { isDeleted: false },
            select: {
              id: true,
              status: true,
              festivalId: true,
              festival: { select: { name: true } },
            },
          },
          userPoints: {
            select: { points: true },
          },
        },
      }),
      prisma.user.count({ where: where as never }),
    ]);

    let participants: ParticipantListItem[] = users.map((u) => {
      const totalPoints = u.userPoints.reduce((sum, p) => sum + p.points, 0);
      const approvedRegistrations = u.registrations.filter((r) => r.status === "APPROVED" || r.status === "CHECKED_IN" || r.status === "COMPLETED").length;
      const festivals = [...new Set(u.registrations.map((r) => r.festival?.name).filter(Boolean))] as string[];
      const participantStatus: "ACTIVE" | "SUSPENDED" | "BLACKLISTED" =
        u.banReason === "BLACKLISTED" ? "BLACKLISTED" : u.bannedAt ? "SUSPENDED" : "ACTIVE";

      return {
        id: u.id,
        username: u.username,
        globalName: u.globalName,
        avatarUrl: u.avatarUrl,
        email: u.email,
        bannedAt: u.bannedAt,
        banReason: u.banReason,
        createdAt: u.createdAt,
        discordAccount: u.discordAccount,
        totalPoints,
        totalRegistrations: u.registrations.length,
        approvedRegistrations,
        festivals,
        status: participantStatus,
      };
    });

    // Client-side sort for points/activity
    if (sortBy === "highestPoints") {
      participants = participants.sort((a, b) => b.totalPoints - a.totalPoints);
    } else if (sortBy === "lowestPoints") {
      participants = participants.sort((a, b) => a.totalPoints - b.totalPoints);
    } else if (sortBy === "mostActive") {
      participants = participants.sort((a, b) => b.totalRegistrations - a.totalRegistrations);
    } else if (sortBy === "highestAttendance") {
      participants = participants.sort((a, b) => b.approvedRegistrations - a.approvedRegistrations);
    }

    return ok({ participants, total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getParticipantStats(): Promise<ActionResult<ParticipantStats>> {
  try {
    await requireAuth();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalParticipants,
      activeParticipants,
      newThisWeek,
      suspendedParticipants,
      pointsAgg,
      topUser,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, bannedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { deletedAt: null, bannedAt: { not: null } } }),
      prisma.userPoints.aggregate({ _avg: { points: true }, _sum: { points: true } }),
      prisma.user.findFirst({
        where: { deletedAt: null },
        orderBy: { registrations: { _count: "desc" } },
        select: { username: true, globalName: true },
      }),
    ]);

    const totalRegistrations = await prisma.registration.count({
      where: { isDeleted: false, status: { in: ["COMPLETED", "CHECKED_IN"] } },
    });

    return ok({
      totalParticipants,
      activeParticipants,
      newThisWeek,
      suspendedParticipants,
      avgAttendance: totalParticipants > 0 ? Math.round((totalRegistrations / totalParticipants) * 100) / 100 : 0,
      avgPoints: Math.round(pointsAgg._avg.points ?? 0),
      mostActiveParticipant: topUser?.globalName ?? topUser?.username ?? null,
      totalWins: await prisma.userAchievement.count(),
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getParticipantById(userId: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        discordAccount: true,
        userRoles: { include: { role: true } },
        registrations: {
          where: { isDeleted: false },
          include: {
            festival: { select: { id: true, name: true, slug: true } },
            event: { select: { id: true, title: true, slug: true, startDate: true, endDate: true } },
          },
          orderBy: { registeredAt: "desc" },
        },
        userPoints: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        userAchievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: "desc" },
        },
        userBadges: {
          include: { badge: true },
          orderBy: { earnedAt: "desc" },
        },
        userRewards: {
          include: { reward: true },
          orderBy: { redeemedAt: "desc" },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Participant not found", code: "NOT_FOUND" };
    }

    return ok(user);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getParticipantNotes(userId: string): Promise<ActionResult<ParticipantNote[]>> {
  try {
    await requireAuth();

    // Use registration notes as participant notes (linked via userId)
    const notes = await prisma.registrationNote.findMany({
      where: {
        registration: { userId, isDeleted: false },
        isInternal: true,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        registration: { select: { id: true, passNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return ok(
      notes.map((n) => ({
        id: n.id,
        content: n.content,
        isInternal: n.isInternal,
        createdAt: n.createdAt,
        author: n.author,
        registrationPassNumber: (n as any).registration?.passNumber,
      })) as ParticipantNote[]
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function addParticipantNote(
  userId: string,
  content: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    // Find or create a "general" registration for this user to attach notes
    const registration = await prisma.registration.findFirst({
      where: { userId, isDeleted: false },
      orderBy: { registeredAt: "desc" },
    });

    if (!registration) {
      return { success: false, error: "No registration found for this participant", code: "NOT_FOUND" };
    }

    const note = await prisma.registrationNote.create({
      data: {
        registrationId: registration.id,
        authorId: session.userId,
        content,
        isInternal: true,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_NOTE_ADD",
      targetEntity: "User",
      targetId: userId,
      changesJson: { content },
    });

    return ok(note);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateParticipantNote(
  noteId: string,
  content: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const note = await prisma.registrationNote.update({
      where: { id: noteId },
      data: { content },
    });

    return ok(note);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteParticipantNote(noteId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.registrationNote.delete({ where: { id: noteId } });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function awardBonusPoints(
  userId: string,
  points: number,
  reason: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.userPoints.create({
      data: {
        userId,
        points,
        source: "ADMIN_AWARD",
        reason,
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_POINTS_AWARD",
      targetEntity: "User",
      targetId: userId,
      changesJson: { points, reason },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deductPoints(
  userId: string,
  points: number,
  reason: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.userPoints.create({
      data: {
        userId,
        points: -Math.abs(points),
        source: "ADMIN_DEDUCT",
        reason,
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_POINTS_DEDUCT",
      targetEntity: "User",
      targetId: userId,
      changesJson: { points, reason },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function suspendParticipant(
  userId: string,
  reason: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.user.update({
      where: { id: userId },
      data: { bannedAt: new Date(), banReason: reason },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_SUSPEND",
      targetEntity: "User",
      targetId: userId,
      changesJson: { reason },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function unsuspendParticipant(userId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.user.update({
      where: { id: userId },
      data: { bannedAt: null, banReason: null },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_UNSUSPEND",
      targetEntity: "User",
      targetId: userId,
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function blacklistParticipant(
  userId: string,
  reason: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.user.update({
      where: { id: userId },
      data: { bannedAt: new Date(), banReason: "BLACKLISTED: " + reason },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_BLACKLIST",
      targetEntity: "User",
      targetId: userId,
      changesJson: { reason },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function removeFromFestival(
  userId: string,
  festivalId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.registration.updateMany({
      where: { userId, festivalId, isDeleted: false },
      data: { isDeleted: true },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_REMOVE_FROM_FESTIVAL",
      targetEntity: "User",
      targetId: userId,
      changesJson: { festivalId },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function resetFestivalPoints(
  userId: string,
  festivalId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    // Get current total points for this user and create a reset entry
    const totalPoints = await prisma.userPoints.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const currentTotal = totalPoints._sum.points ?? 0;
    if (currentTotal > 0) {
      await prisma.userPoints.create({
        data: {
          userId,
          points: -currentTotal,
          source: "ADMIN_RESET",
          reason: `Festival points reset for festival ${festivalId}`,
        },
      });
    }

    await writeAuditLog({
      actorId: session.userId,
      action: "PARTICIPANT_POINTS_RESET",
      targetEntity: "User",
      targetId: userId,
      changesJson: { festivalId, resetAmount: currentTotal },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function approveParticipantRegistration(
  registrationId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: "APPROVED", approvedAt: new Date(), approvedBy: session.userId },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkParticipantAction(
  userIds: string[],
  action: "SUSPEND" | "UNSUSPEND" | "BLACKLIST",
  reason?: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    if (action === "SUSPEND") {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { bannedAt: new Date(), banReason: reason ?? "Bulk suspended" },
      });
    } else if (action === "UNSUSPEND") {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { bannedAt: null, banReason: null },
      });
    } else if (action === "BLACKLIST") {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { bannedAt: new Date(), banReason: "BLACKLISTED: " + (reason ?? "Bulk blacklisted") },
      });
    }

    await writeAuditLog({
      actorId: session.userId,
      action: `PARTICIPANT_BULK_${action}`,
      targetEntity: "User",
      targetId: userIds.join(","),
      changesJson: { userIds, reason },
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getParticipantAnalytics(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();

    const [topByRegistrations, topByPoints, topByAchievements] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { registrations: { _count: "desc" } },
        take: 5,
        select: {
          id: true,
          username: true,
          globalName: true,
          avatarUrl: true,
          _count: { select: { registrations: true } },
        },
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        take: 5,
        select: {
          id: true,
          username: true,
          globalName: true,
          avatarUrl: true,
          userPoints: { select: { points: true } },
        },
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { userAchievements: { _count: "desc" } },
        take: 5,
        select: {
          id: true,
          username: true,
          globalName: true,
          avatarUrl: true,
          _count: { select: { userAchievements: true } },
        },
      }),
    ]);

    const topByPointsSorted = topByPoints
      .map((u) => ({
        ...u,
        totalPoints: u.userPoints.reduce((s, p) => s + p.points, 0),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    return ok({
      mostActive: topByRegistrations,
      topPointEarners: topByPointsSorted,
      mostWins: topByAchievements,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function exportParticipants(
  filters: ParticipantFilters
): Promise<ActionResult<unknown>> {
  try {
    await requireAdmin();

    const result = await getParticipants({ ...filters, perPage: 10000, page: 1 });
    if (!result.success) return result;

    return ok(result.data?.participants ?? []);
  } catch (error) {
    return handleActionError(error);
  }
}

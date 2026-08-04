"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@gameverse/database";

// =====================================================
// Attendance Types
// =====================================================

export type AttendanceStatus =
  | "PRESENT" |"LATE" |"ABSENT" |"EXCUSED" |"LEFT_EARLY" |"DISCONNECTED" |"PENDING_VERIFICATION";

export interface AttendanceFilters {
  search?: string;
  festivalId?: string;
  eventId?: string;
  status?: AttendanceStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
  hostId?: string;
  page?: number;
  perPage?: number;
  sortBy?: "newest" | "oldest" | "longestDuration" | "highestAttendance";
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  userId: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  discordUsername: string | null;
  discordUserId: string | null;
  festivalId: string;
  festivalName: string;
  eventId: string | null;
  eventTitle: string | null;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  durationMinutes: number | null;
  status: AttendanceStatus;
  verifiedBy: string | null;
  verifiedByName: string | null;
  notes: string | null;
  registeredAt: Date;
}

export interface AttendanceStats {
  totalRecords: number;
  presentToday: number;
  absentToday: number;
  lateCheckIns: number;
  excusedParticipants: number;
  averageAttendanceRate: number;
  streakLeader: string | null;
  currentLiveAttendance: number;
}

export interface AttendanceNote {
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

// =====================================================
// Helper: derive attendance status from registration
// =====================================================
function deriveAttendanceStatus(reg: {
  status: string;
  checkedInAt: Date | null;
  checkedInBy: string | null;
  cancelReason: string | null;
  notes: string | null;
}): AttendanceStatus {
  if (reg.status === "CANCELLED") return "ABSENT";
  if (reg.cancelReason?.includes("EXCUSED")) return "EXCUSED";
  if (reg.notes?.includes("LEFT_EARLY")) return "LEFT_EARLY";
  if (reg.notes?.includes("DISCONNECTED")) return "DISCONNECTED";
  if (reg.notes?.includes("LATE")) return "LATE";
  if (reg.status === "CHECKED_IN" || reg.status === "COMPLETED") {
    return reg.checkedInAt ? "PRESENT" : "PENDING_VERIFICATION";
  }
  if (reg.status === "APPROVED") return "PENDING_VERIFICATION";
  return "ABSENT";
}

// =====================================================
// Get Attendance Records
// =====================================================
export async function getAttendanceRecords(
  filters: AttendanceFilters
): Promise<ActionResult<{ records: AttendanceRecord[]; total: number; page: number; perPage: number; totalPages: number }>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const {
      search,
      festivalId,
      eventId,
      status = "ALL",
      dateFrom,
      dateTo,
      page = 1,
      perPage = 20,
      sortBy = "newest",
    } = filters;

    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { user: { username: { contains: search, mode: "insensitive" } } },
        { user: { globalName: { contains: search, mode: "insensitive" } } },
        { discordUsername: { contains: search, mode: "insensitive" } },
        { user: { discordAccount: { username: { contains: search, mode: "insensitive" } } } },
        { festival: { name: { contains: search, mode: "insensitive" } } },
        { event: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (festivalId && festivalId !== "ALL") {
      where.festivalId = festivalId;
    }
    if (eventId && eventId !== "ALL") {
      where.eventId = eventId;
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.registeredAt = dateFilter;
    }

    // Status filter mapping
    if (status !== "ALL") {
      if (status === "PRESENT") {
        where.status = { in: ["CHECKED_IN", "COMPLETED"] };
        where.checkedInAt = { not: null };
      } else if (status === "ABSENT") {
        where.status = "CANCELLED";
      } else if (status === "PENDING_VERIFICATION") {
        where.status = "APPROVED";
        where.checkedInAt = null;
      } else if (status === "LATE") {
        where.notes = { contains: "LATE" };
      } else if (status === "EXCUSED") {
        where.cancelReason = { contains: "EXCUSED" };
      } else if (status === "LEFT_EARLY") {
        where.notes = { contains: "LEFT_EARLY" };
      } else if (status === "DISCONNECTED") {
        where.notes = { contains: "DISCONNECTED" };
      }
    }

    let orderBy: Record<string, unknown> = { registeredAt: "desc" };
    if (sortBy === "oldest") orderBy = { registeredAt: "asc" };
    else if (sortBy === "longestDuration") orderBy = { checkedInAt: "asc" };

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where: where as never,
        orderBy: orderBy as never,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              globalName: true,
              avatarUrl: true,
              discordAccount: {
                select: { discordUserId: true, username: true },
              },
            },
          },
          festival: { select: { id: true, name: true } },
          event: { select: { id: true, title: true, startDate: true, endDate: true } },
        },
      }),
      prisma.registration.count({ where: where as never }),
    ]);

    const records: AttendanceRecord[] = registrations.map((reg) => {
      const regAny = reg as any;
      const checkIn = reg.checkedInAt;
      const checkOut = regAny.event?.endDate ?? null;
      const durationMinutes =
        checkIn && checkOut
          ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000)
          : null;

      return {
        id: reg.id,
        registrationId: reg.id,
        userId: reg.userId,
        username: regAny.user?.username ?? "",
        globalName: regAny.user?.globalName ?? null,
        avatarUrl: regAny.user?.avatarUrl ?? null,
        discordUsername: reg.discordUsername ?? regAny.user?.discordAccount?.username ?? null,
        discordUserId: regAny.user?.discordAccount?.discordUserId ?? null,
        festivalId: reg.festivalId,
        festivalName: regAny.festival?.name ?? "",
        eventId: reg.eventId ?? null,
        eventTitle: regAny.event?.title ?? null,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        durationMinutes,
        status: deriveAttendanceStatus({
          status: reg.status,
          checkedInAt: reg.checkedInAt,
          checkedInBy: reg.checkedInBy,
          cancelReason: reg.cancelReason,
          notes: reg.notes,
        }),
        verifiedBy: reg.checkedInBy ?? null,
        verifiedByName: null,
        notes: reg.notes ?? null,
        registeredAt: reg.registeredAt,
      };
    });

    return ok({ records, total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Get Attendance Stats
// =====================================================
export async function getAttendanceStats(): Promise<ActionResult<AttendanceStats>> {
  try {
    await requireAuth();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalRecords,
      presentToday,
      absentToday,
      lateCheckIns,
      excusedParticipants,
      currentLiveAttendance,
      topUser,
    ] = await Promise.all([
      prisma.registration.count({ where: { isDeleted: false } }),
      prisma.registration.count({
        where: {
          isDeleted: false,
          checkedInAt: { gte: todayStart, lt: todayEnd },
          status: { in: ["CHECKED_IN", "COMPLETED"] },
        },
      }),
      prisma.registration.count({
        where: {
          isDeleted: false,
          status: "CANCELLED",
          registeredAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.registration.count({
        where: {
          isDeleted: false,
          notes: { contains: "LATE" },
        },
      }),
      prisma.registration.count({
        where: {
          isDeleted: false,
          cancelReason: { contains: "EXCUSED" },
        },
      }),
      prisma.registration.count({
        where: {
          isDeleted: false,
          status: "CHECKED_IN",
        },
      }),
      prisma.user.findFirst({
        where: { deletedAt: null },
        orderBy: {
          registrations: { _count: "desc" },
        },
        select: { username: true, globalName: true },
      }),
    ]);

    const approvedCount = await prisma.registration.count({
      where: { isDeleted: false, status: { in: ["APPROVED", "CHECKED_IN", "COMPLETED"] } },
    });
    const averageAttendanceRate =
      totalRecords > 0 ? Math.round((approvedCount / totalRecords) * 100) : 0;

    return ok({
      totalRecords,
      presentToday,
      absentToday,
      lateCheckIns,
      excusedParticipants,
      averageAttendanceRate,
      streakLeader: topUser?.globalName ?? topUser?.username ?? null,
      currentLiveAttendance,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Get Single Attendance Record (Registration Detail)
// =====================================================
export async function getAttendanceById(id: string): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();
    const reg = await prisma.registration.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            globalName: true,
            avatarUrl: true,
            email: true,
            bio: true,
            discordAccount: {
              select: {
                discordUserId: true,
                username: true,
                discriminator: true,
                avatarUrl: true,
                globalName: true,
              },
            },
          },
        },
        festival: { select: { id: true, name: true, logoUrl: true } },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
            discordVoiceChannelId: true,
          },
        },
        notesList: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        timeline: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!reg) {
      return handleActionError(new Error("Attendance record not found"));
    }

    return ok(reg);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Manual Check-In
// =====================================================
export async function checkInParticipant(registrationId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const reg = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        checkedInAt: new Date(),
        checkedInBy: session.userId,
        status: "CHECKED_IN",
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "ATTENDANCE_CHECK_IN",
      targetEntity: "Registration",
      targetId: registrationId,
      changesJson: { checkedInAt: new Date().toISOString() },
    });

    return ok(reg);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Manual Check-Out
// =====================================================
export async function checkOutParticipant(registrationId: string): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const reg = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: "COMPLETED",
        notes: (await prisma.registration.findUnique({ where: { id: registrationId }, select: { notes: true } }))?.notes ?? "",
      },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "ATTENDANCE_CHECK_OUT",
      targetEntity: "Registration",
      targetId: registrationId,
      changesJson: { checkedOutAt: new Date().toISOString() },
    });

    return ok(reg);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Update Attendance Status
// =====================================================
export async function updateAttendanceStatus(
  registrationId: string,
  status: AttendanceStatus,
  note?: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const statusMap: Record<AttendanceStatus, string> = {
      PRESENT: "CHECKED_IN",
      LATE: "CHECKED_IN",
      ABSENT: "CANCELLED",
      EXCUSED: "CANCELLED",
      LEFT_EARLY: "COMPLETED",
      DISCONNECTED: "COMPLETED",
      PENDING_VERIFICATION: "APPROVED",
    };

    let updateData: Record<string, unknown> = {
      status: statusMap[status],
    };

    if (status === "PRESENT" || status === "LATE") {
      updateData.checkedInAt = new Date();
      updateData.checkedInBy = session.userId;
    }

    if (status === "EXCUSED") {
      updateData.cancelReason = "EXCUSED";
    }

    if (note) {
      const existing = await prisma.registration.findUnique({
        where: { id: registrationId },
        select: { notes: true },
      });
      updateData.notes = existing?.notes ? `${existing.notes}\n${status}` : status;
    } else if (["LATE", "LEFT_EARLY", "DISCONNECTED"].includes(status)) {
      const existing = await prisma.registration.findUnique({
        where: { id: registrationId },
        select: { notes: true },
      });
      updateData.notes = existing?.notes ? `${existing.notes}\n${status}` : status;
    }

    const reg = await prisma.registration.update({
      where: { id: registrationId },
      data: updateData as never,
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "ATTENDANCE_STATUS_UPDATE",
      targetEntity: "Registration",
      targetId: registrationId,
      changesJson: { status, note },
    });

    return ok(reg);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Bulk Attendance Actions
// =====================================================
export async function bulkAttendanceAction(
  ids: string[],
  action: "MARK_PRESENT" | "MARK_ABSENT" | "MARK_EXCUSED"
): Promise<ActionResult<{ updated: number }>> {
  try {
    const session = await requireAuth();
    await requireAdmin();
    await checkMutationRateLimit(session.userId);

    let updateData: Record<string, unknown> = {};
    if (action === "MARK_PRESENT") {
      updateData = { status: "CHECKED_IN", checkedInAt: new Date(), checkedInBy: session.userId };
    } else if (action === "MARK_ABSENT") {
      updateData = { status: "CANCELLED" };
    } else if (action === "MARK_EXCUSED") {
      updateData = { status: "CANCELLED", cancelReason: "EXCUSED" };
    }

    const result = await prisma.registration.updateMany({
      where: { id: { in: ids }, isDeleted: false },
      data: updateData as never,
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "ATTENDANCE_BULK_UPDATE",
      targetEntity: "Registration",
      targetId: "bulk",
      changesJson: { action, count: result.count, ids },
    });

    return ok({ updated: result.count });
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Add Staff Note
// =====================================================
export async function addAttendanceNote(
  registrationId: string,
  content: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await requireAuth();
    await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const note = await prisma.registrationNote.create({
      data: {
        registrationId,
        authorId: session.userId,
        content,
        isInternal: true,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return ok(note);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Export Attendance
// =====================================================
export async function exportAttendance(
  filters: AttendanceFilters
): Promise<ActionResult<AttendanceRecord[]>> {
  try {
    await requireAuth();
    await requireAdmin();

    const result = await getAttendanceRecords({ ...filters, page: 1, perPage: 10000 });
    if (!result.success || !result.data) {
      return handleActionError(new Error("Failed to fetch records"));
    }
    return ok(result.data.records);
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Get Attendance Analytics
// =====================================================
export async function getAttendanceAnalytics(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();

    const now = new Date();
    const days: { date: string; present: number; absent: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

      const [present, absent] = await Promise.all([
        prisma.registration.count({
          where: {
            isDeleted: false,
            checkedInAt: { gte: start, lt: end },
            status: { in: ["CHECKED_IN", "COMPLETED"] },
          },
        }),
        prisma.registration.count({
          where: {
            isDeleted: false,
            status: "CANCELLED",
            registeredAt: { gte: start, lt: end },
          },
        }),
      ]);

      days.push({
        date: start.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        present,
        absent,
      });
    }

    // Most active participants
    const topParticipants = await prisma.user.findMany({
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
    });

    return ok({ dailyAttendance: days, topParticipants });
  } catch (error) {
    return handleActionError(error);
  }
}

// =====================================================
// Get Live Event Attendance
// =====================================================
export async function getLiveEventAttendance(): Promise<ActionResult<unknown>> {
  try {
    await requireAuth();

    const liveEvents = await prisma.communityEvent.findMany({
      where: { status: "LIVE", isDeleted: false },
      select: {
        id: true,
        title: true,
        startDate: true,
        capacity: true,
        _count: {
          select: {
            registrations: {
              where: { isDeleted: false, status: { in: ["CHECKED_IN", "COMPLETED"] } },
            },
          },
        },
        registrations: {
          where: { isDeleted: false },
          select: { id: true, status: true },
        },
      },
    });

    const liveData = liveEvents.map((ev) => {
      const totalRegistered = ev.registrations.length;
      const checkedIn = ev._count.registrations;
      const remaining = totalRegistered - checkedIn;
      const attendancePct = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;
      const elapsed = Math.round((Date.now() - new Date(ev.startDate).getTime()) / 60000);

      return {
        id: ev.id,
        title: ev.title,
        startDate: ev.startDate,
        capacity: ev.capacity,
        totalRegistered,
        checkedIn,
        remaining,
        attendancePct,
        elapsedMinutes: elapsed,
      };
    });

    return ok(liveData);
  } catch (error) {
    return handleActionError(error);
  }
}

import { prisma } from "../client";
import type {
  Registration,
  RegistrationListItem,
  RegistrationWithRelations,
  RegistrationNote,
  RegistrationFilters,
  PaginatedRegistrations,
  RegistrationStats,
  RegistrationExportRow,
  CreateRegistrationInput,
} from "@gameverse/types";

// =====================================================
// Registration Repository
// =====================================================

export class RegistrationRepository {
  async findById(id: string): Promise<Registration | null> {
    return prisma.registration.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  async findByIdWithRelations(
    id: string
  ): Promise<RegistrationWithRelations | null> {
    return prisma.registration.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            globalName: true,
            bio: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
        festival: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        formVersion: {
          select: {
            id: true,
            version: true,
            fieldsJson: true,
          },
        },
        responses: {
          include: {
            formField: {
              select: {
                id: true,
                label: true,
                fieldType: true,
                fieldName: true,
              },
            },
          },
        },
        notesList: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async findByUserAndEvent(
    userId: string,
    eventId: string
  ): Promise<Registration | null> {
    return prisma.registration.findFirst({
      where: {
        userId,
        eventId,
        isDeleted: false,
      },
    });
  }

  async findByPassNumber(passNumber: string): Promise<Registration | null> {
    return prisma.registration.findFirst({
      where: {
        passNumber,
        isDeleted: false,
      },
    });
  }

  async findByQrCode(qrCode: string): Promise<Registration | null> {
    return prisma.registration.findFirst({
      where: {
        qrCode,
        isDeleted: false,
      },
    });
  }

  async findMany(
    filters: RegistrationFilters
  ): Promise<PaginatedRegistrations> {
    const {
      search,
      festivalId,
      eventId,
      status,
      dateFrom,
      dateTo,
      sortBy = "registeredAt",
      sortOrder = "desc",
      page = 1,
      perPage = 20,
    } = filters;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { passNumber: { contains: search, mode: "insensitive" as const } },
          { user: { username: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(festivalId && { festivalId }),
      ...(eventId && { eventId }),
      ...(status && { status }),
      ...(dateFrom && {
        registeredAt: { gte: new Date(dateFrom) },
      }),
      ...(dateTo && {
        registeredAt: { lte: new Date(dateTo) },
      }),
    };

    const orderBy =
      sortBy === "user"
        ? { user: { username: sortOrder } }
        : sortBy === "event"
          ? { event: { title: sortOrder } }
          : { [sortBy]: sortOrder };

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: orderBy as never,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              globalName: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          festival: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              responses: true,
              notesList: true,
            },
          },
        },
      }),
      prisma.registration.count({ where }),
    ]);

    return {
      registrations: registrations as RegistrationListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findByEvent(
    eventId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedRegistrations> {
    return this.findMany({ eventId, page, perPage });
  }

  async findByUser(
    userId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedRegistrations> {
    const where = {
      userId,
      isDeleted: false,
    };

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { registeredAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              globalName: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          festival: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              responses: true,
              notesList: true,
            },
          },
        },
      }),
      prisma.registration.count({ where }),
    ]);

    return {
      registrations: registrations as RegistrationListItem[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getStats(eventId?: string): Promise<RegistrationStats> {
    const baseWhere = {
      isDeleted: false,
      ...(eventId && { eventId }),
    };

    const [
      total,
      pending,
      approved,
      rejected,
      waitlisted,
      cancelled,
      checkedIn,
      completed,
    ] = await Promise.all([
      prisma.registration.count({ where: baseWhere }),
      prisma.registration.count({ where: { ...baseWhere, status: "PENDING" } }),
      prisma.registration.count({ where: { ...baseWhere, status: "APPROVED" } }),
      prisma.registration.count({ where: { ...baseWhere, status: "REJECTED" } }),
      prisma.registration.count({ where: { ...baseWhere, status: "WAITLISTED" } }),
      prisma.registration.count({ where: { ...baseWhere, status: "CANCELLED" } }),
      prisma.registration.count({ where: { ...baseWhere, status: "CHECKED_IN" } }),
      prisma.registration.count({ where: { ...baseWhere, status: "COMPLETED" } }),
    ]);

    return {
      totalRegistrations: total,
      pendingRegistrations: pending,
      approvedRegistrations: approved,
      rejectedRegistrations: rejected,
      waitlistedRegistrations: waitlisted,
      cancelledRegistrations: cancelled,
      checkedInRegistrations: checkedIn,
      completedRegistrations: completed,
    };
  }

  async getEventCapacity(eventId: string): Promise<{
    capacity: number | null;
    registered: number;
    approved: number;
    waitlisted: number;
    spotsLeft: number | null;
  }> {
    const event = await prisma.communityEvent.findUnique({
      where: { id: eventId },
      select: { capacity: true },
    });

    const [registered, approved, waitlisted] = await Promise.all([
      prisma.registration.count({
        where: {
          eventId,
          isDeleted: false,
          status: { not: "CANCELLED" },
        },
      }),
      prisma.registration.count({
        where: {
          eventId,
          isDeleted: false,
          status: "APPROVED",
        },
      }),
      prisma.registration.count({
        where: {
          eventId,
          isDeleted: false,
          status: "WAITLISTED",
        },
      }),
    ]);

    const capacity = event?.capacity ?? null;
    const spotsLeft = capacity !== null ? Math.max(0, capacity - approved) : null;

    return {
      capacity,
      registered,
      approved,
      waitlisted,
      spotsLeft,
    };
  }

  async create(
    data: CreateRegistrationInput,
    passNumber: string,
    qrCode: string
  ): Promise<Registration> {
    const registration = await prisma.registration.create({
      data: {
        userId: data.userId,
        festivalId: data.festivalId,
        eventId: data.eventId,
        passNumber,
        qrCode,
        status: "PENDING",
        fullName: data.fullName,
        email: data.email,
        interest: data.interest,
        discordUsername: data.discordUsername ?? null,
      },
    });

    await prisma.registrationTimeline.create({
      data: {
        registrationId: registration.id,
        action: "CREATED",
        actorId: data.userId,
        details: { eventId: data.eventId },
      },
    });

    return registration;
  }

  async updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "WAITLISTED",
    actorId: string,
    actorName?: string
  ): Promise<Registration> {
    const current = await prisma.registration.findUnique({
      where: { id },
      select: { status: true },
    });

    const updateData: Record<string, unknown> = { status };

    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
      updateData.approvedBy = actorId;
    } else if (status === "REJECTED") {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = actorId;
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: updateData,
    });

    await prisma.registrationTimeline.create({
      data: {
        registrationId: id,
        action: "STATUS_CHANGED",
        actorId,
        actorName,
        details: { from: current?.status ?? "PENDING", to: status },
      },
    });

    return registration;
  }

  async cancel(
    id: string,
    cancelReason?: string,
    actorId?: string
  ): Promise<Registration> {
    const registration = await prisma.registration.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelReason,
      },
    });

    await prisma.registrationTimeline.create({
      data: {
        registrationId: id,
        action: "CANCELLED",
        actorId,
        details: { reason: cancelReason },
      },
    });

    return registration;
  }

  async checkIn(
    id: string,
    checkedInBy: string,
    method: "manual" | "qr" = "manual"
  ): Promise<Registration> {
    const registration = await prisma.registration.update({
      where: { id },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
        checkedInBy,
      },
    });

    await prisma.registrationTimeline.create({
      data: {
        registrationId: id,
        action: "CHECKED_IN",
        actorId: checkedInBy,
        details: { method },
      },
    });

    return registration;
  }

  async addNote(
    registrationId: string,
    authorId: string,
    content: string,
    isInternal: boolean = true
  ): Promise<RegistrationNote> {
    const note = await prisma.registrationNote.create({
      data: {
        registrationId,
        authorId,
        content,
        isInternal,
      },
    });

    await prisma.registrationTimeline.create({
      data: {
        registrationId,
        action: "NOTE_ADDED",
        actorId: authorId,
        details: { isInternal },
      },
    });

    return note;
  }

  async delete(id: string): Promise<void> {
    await prisma.registration.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async bulkUpdateStatus(
    ids: string[],
    status: "APPROVED" | "REJECTED" | "WAITLISTED",
    actorId: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };

    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
      updateData.approvedBy = actorId;
    } else if (status === "REJECTED") {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = actorId;
    }

    await prisma.registration.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    await prisma.registrationTimeline.createMany({
      data: ids.map((registrationId: string) => ({
        registrationId,
        action: "STATUS_CHANGED",
        actorId,
        details: { to: status, bulk: true },
      })),
    });
  }

  async bulkCheckIn(ids: string[], checkedInBy: string): Promise<void> {
    await prisma.registration.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
        checkedInBy,
      },
    });

    await prisma.registrationTimeline.createMany({
      data: ids.map((registrationId: string) => ({
        registrationId,
        action: "CHECKED_IN",
        actorId: checkedInBy,
        details: { method: "bulk" },
      })),
    });
  }

  async exportByEvent(
    eventId: string
  ): Promise<{ headers: string[]; rows: RegistrationExportRow[] }> {
    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
        festival: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { registeredAt: "asc" },
    });

    const headers = [
      "Pass Number",
      "Username",
      "Email",
      "Event",
      "Festival",
      "Status",
      "Registered At",
      "Checked In At",
    ];

    const rows: RegistrationExportRow[] = registrations.map((r: { passNumber: string; user: { username: string; email: string }; event: { title: string } | null; festival: { name: string }; status: string; registeredAt: Date; checkedInAt: Date | null }) => ({
      passNumber: r.passNumber,
      username: r.user.username,
      email: r.user.email,
      event: r.event?.title ?? "N/A",
      festival: r.festival.name,
      status: r.status,
      registeredAt: r.registeredAt.toISOString(),
      checkedInAt: r.checkedInAt?.toISOString() ?? "",
    }));

    return { headers, rows };
  }

  async generatePassNumber(): Promise<string> {
    const { randomBytes } = await import("crypto");
    const year = new Date().getFullYear();
    const uniqueId = randomBytes(4).toString("hex").toUpperCase().substring(0, 8);
    return `GVR-${year}-${uniqueId}`;
  }

  async generateQrCode(): Promise<string> {
    const { randomUUID } = await import("crypto");
    return `QR-${randomUUID()}`;
  }
}

export const registrationRepository = new RegistrationRepository();

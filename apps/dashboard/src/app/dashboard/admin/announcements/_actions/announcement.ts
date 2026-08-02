"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { checkMutationRateLimit, checkReadRateLimit } from "@/lib/rate-limit";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import {
  announcementRepository,
  festivalRepository,
  notificationRepository,
  prisma,
} from "@gameverse/database";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementFiltersSchema,
  bulkAnnouncementActionSchema,
} from "@gameverse/validation";
import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementFiltersInput,
  BulkAnnouncementActionInput,
} from "@gameverse/validation";

// =====================================================
// Announcement Server Actions
// =====================================================

export async function getAnnouncements(
  filters: AnnouncementFiltersInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const validatedFilters = announcementFiltersSchema.parse(filters);
    const result = await announcementRepository.findMany(validatedFilters as never);
    return ok(result);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAnnouncementById(
  id: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const announcement = await announcementRepository.findByIdWithRelations(id);
    if (!announcement) {
      return handleActionError(new Error("Announcement not found"));
    }
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAnnouncementBySlug(
  slug: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const announcement = await announcementRepository.findBySlug(slug);
    if (!announcement) {
      return handleActionError(new Error("Announcement not found"));
    }
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getPinnedAnnouncements(
  festivalId?: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const announcements = await announcementRepository.findPinned(festivalId);
    return ok(announcements);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getAnnouncementStats(
  festivalId?: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    await checkReadRateLimit(session.userId);

    const stats = await announcementRepository.getStats(festivalId);
    return ok(stats);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createAnnouncement(
  data: CreateAnnouncementInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const validatedData = createAnnouncementSchema.parse(data);

    const existingSlug = await announcementRepository.findBySlug(
      validatedData.slug
    );
    if (existingSlug) {
      return handleActionError(
        new Error("An announcement with this slug already exists")
      );
    }

    if (validatedData.festivalId) {
      const festival = await festivalRepository.findById(
        validatedData.festivalId
      );
      if (!festival) {
        return handleActionError(new Error("Festival not found"));
      }
    }

    const announcement = await announcementRepository.create(validatedData as never);
    await writeAuditLog({
      actorId: session.userId,
      action: "ANNOUNCEMENT_CREATE",
      targetEntity: "Announcement",
      targetId: announcement.id,
      changesJson: { title: validatedData.title, slug: validatedData.slug },
    });
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingAnnouncement = await announcementRepository.findById(id);
    if (!existingAnnouncement) {
      return handleActionError(new Error("Announcement not found"));
    }

    const validatedData = updateAnnouncementSchema.parse(data);

    if (validatedData.slug && validatedData.slug !== existingAnnouncement.slug) {
      const slugExists = await announcementRepository.findBySlug(
        validatedData.slug
      );
      if (slugExists) {
        return handleActionError(
          new Error("An announcement with this slug already exists")
        );
      }
    }

    const announcement = await announcementRepository.update(id, validatedData as never);
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function publishAnnouncement(
  id: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingAnnouncement = await announcementRepository.findById(id);
    if (!existingAnnouncement) {
      return handleActionError(new Error("Announcement not found"));
    }

    const announcement = await announcementRepository.publish(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "ANNOUNCEMENT_PUBLISH",
      targetEntity: "Announcement",
      targetId: id,
    });

    if (
      announcement.visibility === "PUBLIC" ||
      announcement.visibility === "MEMBERS_ONLY"
    ) {
      await createNotificationsForAnnouncement(
        announcement.id,
        announcement.title,
        announcement.festivalId
      );
    }

    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function unpublishAnnouncement(
  id: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const existingAnnouncement = await announcementRepository.findById(id);
    if (!existingAnnouncement) {
      return handleActionError(new Error("Announcement not found"));
    }

    const announcement = await announcementRepository.unpublish(id);
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function pinAnnouncement(
  id: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const announcement = await announcementRepository.pin(id);
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function unpinAnnouncement(
  id: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const announcement = await announcementRepository.unpin(id);
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveAnnouncement(
  id: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const announcement = await announcementRepository.archive(id);
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAnnouncement(
  id: string
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await announcementRepository.delete(id);
    await writeAuditLog({
      actorId: session.userId,
      action: "ANNOUNCEMENT_DELETE",
      targetEntity: "Announcement",
      targetId: id,
    });
    return ok({ success: true });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDeleteAnnouncements(
  ids: string[]
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await announcementRepository.bulkDelete(ids);
    return ok({ success: true });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkArchiveAnnouncements(
  ids: string[]
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    await announcementRepository.bulkArchive(ids);
    return ok({ success: true });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function handleBulkAnnouncementAction(
  action: string,
  input: BulkAnnouncementActionInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);

    const validatedInput = bulkAnnouncementActionSchema.parse(input);

    switch (action) {
      case "DELETE":
        await announcementRepository.bulkDelete(validatedInput.announcementIds);
        break;
      case "ARCHIVE":
        await announcementRepository.bulkArchive(validatedInput.announcementIds);
        break;
      case "PIN":
        for (const id of validatedInput.announcementIds) {
          await announcementRepository.pin(id);
        }
        break;
      case "UNPIN":
        for (const id of validatedInput.announcementIds) {
          await announcementRepository.unpin(id);
        }
        break;
      case "PUBLISH":
        for (const id of validatedInput.announcementIds) {
          await announcementRepository.publish(id);
        }
        break;
      case "UNPUBLISH":
        for (const id of validatedInput.announcementIds) {
          await announcementRepository.unpublish(id);
        }
        break;
      default:
        return handleActionError(new Error("Invalid bulk action"));
    }

    return ok({ success: true });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function duplicateAnnouncement(
  id: string,
  data: { title: string; slug: string }
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    const announcement = await announcementRepository.duplicate(id, data);
    return ok(announcement);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkPublishAnnouncements(
  announcementIds: string[]
): Promise<ActionResult<any>> {
  try {
    const session = await requireAdmin();
    await checkMutationRateLimit(session.userId);
    await announcementRepository.bulkPublish(announcementIds);
    return ok({ success: true });
  } catch (error) {
    return handleActionError(error);
  }
}

async function createNotificationsForAnnouncement(
  announcementId: string,
  title: string,
  festivalId?: string | null
) {
  try {
    const users = await prisma.user.findMany({
      where: {
        bannedAt: null,
        deletedAt: null,
      },
      select: { id: true },
    });

    const notificationsData = users.map((u: { id: string }) => ({
      userId: u.id,
      type: "ANNOUNCEMENT" as const,
      title: `New Announcement: ${title}`,
      message: `A new announcement has been published. Click to view details.`,
      link: `/dashboard/announcements/${announcementId}`,
      metadata: { announcementId, festivalId },
    }));

    await notificationRepository.createMany(notificationsData as never);
  } catch {
    // Non-blocking notification creation failure
  }
}

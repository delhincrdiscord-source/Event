"use server";

import { prisma } from "@gameverse/database";
import { requireAuth } from "@/lib/auth";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { deleteFile } from "@/lib/storage";

export interface GalleryItemData {
  id: string;
  title: string;
  mediaId: string;
  authorId: string;
  isApproved: boolean;
  createdAt: Date;
  media: {
    url: string;
    mimeType: string;
  };
  author: {
    username: string;
    avatarUrl: string | null;
  };
}

export async function getGalleryItems(options?: {
  page?: number;
  perPage?: number;
  approvedOnly?: boolean;
}): Promise<ActionResult<{ items: GalleryItemData[]; total: number; page: number; perPage: number; totalPages: number }>> {
  try {
    await requireAuth();
    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 20;
    const approvedOnly = options?.approvedOnly ?? false;

    const where = {
      ...(approvedOnly ? { isApproved: true } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({
        where,
        include: {
          media: { select: { url: true, mimeType: true } },
          author: { select: { username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.galleryItem.count({ where }),
    ]);

    return ok({
      items: items as GalleryItemData[],
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function approveGalleryItem(id: string): Promise<ActionResult<null>> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return { success: false, error: "You do not have permission to approve gallery items", code: "FORBIDDEN" };
    }

    const item = await prisma.galleryItem.findUnique({ where: { id } });
    if (!item) {
      return { success: false, error: "Gallery item not found", code: "NOT_FOUND" };
    }

    await prisma.galleryItem.update({
      where: { id },
      data: { isApproved: true, approvedById: session.userId },
    });

    await writeAuditLog({
      actorId: session.userId,
      action: "GALLERY_APPROVE",
      targetEntity: "GalleryItem",
      targetId: id,
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteGalleryItem(id: string): Promise<ActionResult<null>> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Only admins can delete gallery items", code: "FORBIDDEN" };
    }

    const item = await prisma.galleryItem.findUnique({
      where: { id },
      include: { media: { select: { fileKey: true } } },
    });
    if (!item) {
      return { success: false, error: "Gallery item not found", code: "NOT_FOUND" };
    }

    await deleteFile(item.media.fileKey);
    await prisma.galleryItem.delete({ where: { id } });

    await writeAuditLog({
      actorId: session.userId,
      action: "GALLERY_DELETE",
      targetEntity: "GalleryItem",
      targetId: id,
    });

    return ok(null);
  } catch (error) {
    return handleActionError(error);
  }
}

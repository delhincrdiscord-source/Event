"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@gameverse/database";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export async function getCurrentUser(): Promise<ActionResult<UserProfile>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "You must be signed in", code: "UNAUTHORIZED" };
    }

    return ok({
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      role: session.user.role,
      avatarUrl: null,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateUserProfile(data: {
  username?: string;
}): Promise<ActionResult<UserProfile>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "You must be signed in", code: "UNAUTHORIZED" };
    }

    if (data.username && data.username !== session.user.username) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, id: { not: session.user.id } },
      });
      if (existing) {
        return { success: false, error: "Username already taken", code: "CONFLICT" };
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: data.username ? { username: data.username } : {},
      select: { id: true, username: true, email: true, avatarUrl: true },
    });

    return ok({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: session.user.role,
      avatarUrl: updated.avatarUrl,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

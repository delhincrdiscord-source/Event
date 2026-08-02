"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@gameverse/database";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";

export async function getParticipantDashboard(): Promise<{
  success: boolean;
  data?: {
    rank: number;
    totalPoints: number;
    eventsJoined: number;
    wins: number;
    festivalProgress: number;
    daysRemaining: number;
    nextEvent: { title: string; date: string; bannerUrl: string | null } | null;
    recentNotifications: Array<{ id: string; title: string; type: string; createdAt: Date }>;
    upcomingEvents: Array<{ id: string; title: string; slug: string; startDate: Date; bannerUrl: string | null; location: string | null; category: string | null }>;
    recentAchievements: Array<{ id: string; name: string; icon: string; unlockedAt: Date }>;
    badges: Array<{ id: string; name: string; icon: string; tier: string; earnedAt: Date }>;
  };
  error?: string;
  code?: string;
}> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const now = new Date();

    const [
      totalPointsResult,
      rankCount,
      registrations,
      winsCount,
      activeFestival,
      recentNotifications,
      upcomingEvents,
      recentAchievements,
      badges,
      userJoinedEventIds,
    ] = await Promise.all([
      prisma.userPoints.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM (
          SELECT user_id, SUM(points) as total_points
          FROM user_points
          GROUP BY user_id
          HAVING SUM(points) > (
            SELECT COALESCE(SUM(points), 0)
            FROM user_points
            WHERE user_id = ${userId}
          )
        ) AS higher
      `,
      prisma.registration.findMany({
        where: { userId, isDeleted: false },
        select: { eventId: true, status: true },
      }),
      prisma.registration.count({
        where: {
          userId,
          isDeleted: false,
          status: { in: ["APPROVED", "CHECKED_IN"] },
        },
      }),
      prisma.festival.findFirst({
        where: { status: "LIVE", isDeleted: false, isActive: true },
        orderBy: { startDate: "desc" },
        select: { id: true, startDate: true, endDate: true },
      }),
      prisma.notification.findMany({
        where: { userId, isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, type: true, createdAt: true },
      }),
      prisma.communityEvent.findMany({
        where: {
          isDeleted: false,
          status: { in: ["PUBLISHED", "LIVE"] },
          startDate: { gte: now },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          bannerUrl: true,
          location: true,
          category: { select: { name: true } },
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
        take: 5,
        select: {
          achievement: { select: { id: true, name: true, icon: true } },
          unlockedAt: true,
        },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: "desc" },
        select: {
          badge: { select: { id: true, name: true, icon: true, tier: true } },
          earnedAt: true,
        },
      }),
      prisma.registration.findMany({
        where: { userId, isDeleted: false },
        select: { eventId: true },
      }),
    ]);

    const totalPoints = totalPointsResult._sum.points ?? 0;
    const rank = (rankCount[0]?.count ?? 0n) + 1n;

    const joinedEventIds = new Set(userJoinedEventIds.map((r: { eventId: string | null }) => r.eventId).filter(Boolean) as string[]);

    let festivalProgress = 0;
    let daysRemaining = 0;
    if (activeFestival) {
      const festivalStart = new Date(activeFestival.startDate).getTime();
      const festivalEnd = new Date(activeFestival.endDate).getTime();
      const nowTime = now.getTime();
      const totalDuration = festivalEnd - festivalStart;
      const elapsed = nowTime - festivalStart;
      festivalProgress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;
      daysRemaining = Math.max(0, Math.ceil((festivalEnd - nowTime) / (1000 * 60 * 60 * 24)));
    }

    let nextEvent: { title: string; date: string; bannerUrl: string | null } | null = null;
    if (activeFestival) {
      const nextEventResult = await prisma.communityEvent.findFirst({
        where: {
          isDeleted: false,
          status: { in: ["PUBLISHED", "LIVE"] },
          festivalId: activeFestival.id,
          startDate: { gte: now },
          id: { notIn: Array.from(joinedEventIds) },
        },
        orderBy: { startDate: "asc" },
        select: { title: true, startDate: true, bannerUrl: true },
      });
      if (nextEventResult) {
        nextEvent = {
          title: nextEventResult.title,
          date: nextEventResult.startDate.toISOString(),
          bannerUrl: nextEventResult.bannerUrl,
        };
      }
    }

    return ok({
      rank: Number(rank),
      totalPoints,
      eventsJoined: registrations.length,
      wins: winsCount,
      festivalProgress: Math.round(festivalProgress * 10) / 10,
      daysRemaining,
      nextEvent,
      recentNotifications: recentNotifications.map((n: { id: string; title: string; type: string; createdAt: Date }) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        createdAt: n.createdAt,
      })),
      upcomingEvents: upcomingEvents.map((e: { id: string; title: string; slug: string; startDate: Date; bannerUrl: string | null; location: string | null; category: { name: string } | null }) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        startDate: e.startDate,
        bannerUrl: e.bannerUrl,
        location: e.location,
        category: e.category?.name ?? null,
      })),
      recentAchievements: recentAchievements.map((a: { achievement: { id: string; name: string; icon: string }; unlockedAt: Date }) => ({
        id: a.achievement.id,
        name: a.achievement.name,
        icon: a.achievement.icon,
        unlockedAt: a.unlockedAt,
      })),
      badges: badges.map((b: { badge: { id: string; name: string; icon: string; tier: string }; earnedAt: Date }) => ({
        id: b.badge.id,
        name: b.badge.name,
        icon: b.badge.icon,
        tier: b.badge.tier,
        earnedAt: b.earnedAt,
      })),
    });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getLeaderboard(): Promise<ActionResult<Array<{
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  eventsJoined: number;
  wins: number;
  badges: number;
}>>> {
  try {
    await requireAuth();

    const leaderboard = await prisma.$queryRaw<Array<{
      user_id: string;
      username: string;
      avatar_url: string | null;
      total_points: bigint;
      events_joined: bigint;
      wins: bigint;
      badge_count: bigint;
    }>>`
      SELECT
        u.id as user_id,
        u.username,
        u.avatar_url,
        COALESCE(up_agg.total_points, 0) as total_points,
        COALESCE(reg_agg.events_joined, 0) as events_joined,
        COALESCE(reg_agg.wins, 0) as wins,
        COALESCE(ub_agg.badge_count, 0) as badge_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, SUM(points) as total_points
        FROM user_points
        GROUP BY user_id
      ) up_agg ON up_agg.user_id = u.id
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) as events_joined,
          COUNT(CASE WHEN status IN ('APPROVED', 'CHECKED_IN') THEN 1 END) as wins
        FROM registrations
        WHERE is_deleted = false
        GROUP BY user_id
      ) reg_agg ON reg_agg.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as badge_count
        FROM user_badges
        GROUP BY user_id
      ) ub_agg ON ub_agg.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND u.banned_at IS NULL
      ORDER BY total_points DESC, events_joined DESC
      LIMIT 50
    `;

    return ok(
      leaderboard.map((entry: { user_id: string; username: string; avatar_url: string | null; total_points: bigint; events_joined: bigint; wins: bigint; badge_count: bigint }, index: number) => ({
        rank: index + 1,
        userId: entry.user_id,
        username: entry.username,
        avatarUrl: entry.avatar_url,
        totalPoints: Number(entry.total_points),
        eventsJoined: Number(entry.events_joined),
        wins: Number(entry.wins),
        badges: Number(entry.badge_count),
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUserAchievements(): Promise<ActionResult<{
  unlocked: Array<{ id: string; name: string; description: string; icon: string; category: string; pointValue: number; unlockedAt: Date }>;
  locked: Array<{ id: string; name: string; description: string; icon: string; category: string; pointValue: number }>;
}>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          category: true,
          pointValue: true,
        },
        orderBy: { category: "asc" },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: {
          achievementId: true,
          unlockedAt: true,
        },
      }),
    ]);

    const unlockedMap = new Map<string, Date>(
      userAchievements.map((ua: { achievementId: string; unlockedAt: Date }) => [ua.achievementId, ua.unlockedAt])
    );

    const unlocked: Array<{ id: string; name: string; description: string; icon: string; category: string; pointValue: number; unlockedAt: Date }> = [];
    const locked: Array<{ id: string; name: string; description: string; icon: string; category: string; pointValue: number }> = [];

    for (const achievement of allAchievements) {
      const unlockedAt = unlockedMap.get(achievement.id);
      if (unlockedAt) {
        unlocked.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description ?? "",
          icon: achievement.icon,
          category: achievement.category,
          pointValue: achievement.pointValue,
          unlockedAt,
        });
      } else {
        locked.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description ?? "",
          icon: achievement.icon,
          category: achievement.category,
          pointValue: achievement.pointValue,
        });
      }
    }

    return ok({ unlocked, locked });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUserBadges(): Promise<ActionResult<{
  earned: Array<{ id: string; name: string; description: string; icon: string; tier: string; pointValue: number; earnedAt: Date }>;
  available: Array<{ id: string; name: string; description: string; icon: string; tier: string; pointValue: number }>;
}>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const [allBadges, userBadges] = await Promise.all([
      prisma.badge.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          tier: true,
          pointValue: true,
        },
        orderBy: { tier: "asc" },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        select: {
          badgeId: true,
          earnedAt: true,
        },
      }),
    ]);

    const earnedMap = new Map<string, Date>(
      userBadges.map((ub: { badgeId: string; earnedAt: Date }) => [ub.badgeId, ub.earnedAt])
    );

    const earned: Array<{ id: string; name: string; description: string; icon: string; tier: string; pointValue: number; earnedAt: Date }> = [];
    const available: Array<{ id: string; name: string; description: string; icon: string; tier: string; pointValue: number }> = [];

    for (const badge of allBadges) {
      const earnedAt = earnedMap.get(badge.id);
      if (earnedAt) {
        earned.push({
          id: badge.id,
          name: badge.name,
          description: badge.description ?? "",
          icon: badge.icon,
          tier: badge.tier,
          pointValue: badge.pointValue,
          earnedAt,
        });
      } else {
        available.push({
          id: badge.id,
          name: badge.name,
          description: badge.description ?? "",
          icon: badge.icon,
          tier: badge.tier,
          pointValue: badge.pointValue,
        });
      }
    }

    return ok({ earned, available });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getUserRewards(): Promise<ActionResult<{
  available: Array<{ id: string; name: string; description: string; icon: string; pointCost: number; stock: number }>;
  redeemed: Array<{ id: string; name: string; icon: string; redeemedAt: Date }>;
  userPoints: number;
}>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const [allRewards, userRewards, totalPointsResult] = await Promise.all([
      prisma.reward.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          pointCost: true,
          stock: true,
        },
        orderBy: { pointCost: "asc" },
      }),
      prisma.userReward.findMany({
        where: { userId },
        select: {
          rewardId: true,
          redeemedAt: true,
        },
      }),
      prisma.userPoints.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
    ]);

    const userPoints = totalPointsResult._sum.points ?? 0;
    const redeemedMap = new Map<string, Date>(
      userRewards.map((ur: { rewardId: string; redeemedAt: Date }) => [ur.rewardId, ur.redeemedAt])
    );

    const available: Array<{ id: string; name: string; description: string; icon: string; pointCost: number; stock: number }> = [];
    const redeemed: Array<{ id: string; name: string; icon: string; redeemedAt: Date }> = [];

    for (const reward of allRewards) {
      const redeemedAt = redeemedMap.get(reward.id);
      if (redeemedAt) {
        redeemed.push({
          id: reward.id,
          name: reward.name,
          icon: reward.icon,
          redeemedAt,
        });
      } else if (reward.stock !== 0) {
        available.push({
          id: reward.id,
          name: reward.name,
          description: reward.description ?? "",
          icon: reward.icon,
          pointCost: reward.pointCost,
          stock: reward.stock,
        });
      }
    }

    return ok({ available, redeemed, userPoints });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getHallOfFame(): Promise<ActionResult<Array<{
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  achievements: number;
  badges: number;
  bestEvent: string | null;
}>>> {
  try {
    await requireAuth();

    const hallOfFame = await prisma.$queryRaw<Array<{
      user_id: string;
      username: string;
      avatar_url: string | null;
      total_points: bigint;
      achievement_count: bigint;
      badge_count: bigint;
      best_event_title: string | null;
    }>>`
      SELECT
        u.id as user_id,
        u.username,
        u.avatar_url,
        COALESCE(up_agg.total_points, 0) as total_points,
        COALESCE(ua_agg.achievement_count, 0) as achievement_count,
        COALESCE(ub_agg.badge_count, 0) as badge_count,
        best_ev.title as best_event_title
      FROM users u
      LEFT JOIN (
        SELECT user_id, SUM(points) as total_points
        FROM user_points
        GROUP BY user_id
      ) up_agg ON up_agg.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as achievement_count
        FROM user_achievements
        GROUP BY user_id
      ) ua_agg ON ua_agg.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as badge_count
        FROM user_badges
        GROUP BY user_id
      ) ub_agg ON ub_agg.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT ce.title
        FROM registrations r
        INNER JOIN community_events ce ON ce.id = r.event_id
        WHERE r.user_id = u.id
          AND r.is_deleted = false
          AND r.status IN ('APPROVED', 'CHECKED_IN')
        ORDER BY r.registered_at DESC
        LIMIT 1
      ) best_ev ON true
      WHERE u.deleted_at IS NULL
        AND u.banned_at IS NULL
      ORDER BY total_points DESC
      LIMIT 10
    `;

    return ok(
      hallOfFame.map((entry: { user_id: string; username: string; avatar_url: string | null; total_points: bigint; achievement_count: bigint; badge_count: bigint; best_event_title: string | null }, index: number) => ({
        rank: index + 1,
        userId: entry.user_id,
        username: entry.username,
        avatarUrl: entry.avatar_url,
        totalPoints: Number(entry.total_points),
        achievements: Number(entry.achievement_count),
        badges: Number(entry.badge_count),
        bestEvent: entry.best_event_title ?? null,
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getMyRegistrations(): Promise<ActionResult<Array<{
  id: string;
  passNumber: string;
  status: string;
  registeredAt: Date;
  event: { title: string; startDate: Date } | null;
  festival: { name: string };
}>>> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const registrations = await prisma.registration.findMany({
      where: { userId, isDeleted: false },
      orderBy: { registeredAt: "desc" },
      select: {
        id: true,
        passNumber: true,
        status: true,
        registeredAt: true,
        event: {
          select: { title: true, startDate: true },
        },
        festival: {
          select: { name: true },
        },
      },
    });

    return ok(
      registrations.map((r: { id: string; passNumber: string; status: string; registeredAt: Date; event: { title: string; startDate: Date } | null; festival: { name: string } }) => ({
        id: r.id,
        passNumber: r.passNumber,
        status: r.status,
        registeredAt: r.registeredAt,
        event: r.event,
        festival: { name: r.festival.name },
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}

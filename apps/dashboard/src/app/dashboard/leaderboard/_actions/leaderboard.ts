"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@gameverse/database";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  discordUsername: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  eventsJoined: number;
  wins: number;
  attendancePct: number;
  badges: number;
  achievements: number;
  rankChange: number;
  badgeList: Array<{ name: string; icon: string; tier: string }>;
};

export type LeaderboardStats = {
  totalParticipants: number;
  averagePoints: number;
  highestPoints: number;
  festivalLeader: string | null;
};

export type RankMilestone = {
  currentPoints: number;
  currentRank: number;
  nextRankPoints: number;
  nextRankPosition: number;
  progressPct: number;
  pointsNeeded: number;
};

export type PointsHistory = {
  week: string;
  points: number;
  rank: number;
};

export type HallOfFameEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  role: "champion" | "previous_champion" | "most_active" | "mvp";
  roleLabel: string;
};

export type LeaderboardFilters = {
  tab: "festival" | "weekly" | "monthly" | "overall";
  search: string;
  festivalId?: string;
  gameCategory?: string;
  page: number;
  pageSize: number;
};

// ─── Full leaderboard with filters, search, pagination ───────────────────────
export async function getFullLeaderboard(
  filters: LeaderboardFilters
): Promise<
  ActionResult<{
    entries: LeaderboardEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    const session = await requireAuth();
    const { tab, search, festivalId, gameCategory, page, pageSize } = filters;

    const now = new Date();
    let dateFilter: Date | null = null;

    if (tab === "weekly") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (tab === "monthly") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build the base query with optional date filter
    const dateCondition = dateFilter
      ? `AND up.created_at >= '${dateFilter.toISOString()}'`
      : "";

    const festivalCondition = festivalId
      ? `AND r.festival_id = '${festivalId}'::uuid`
      : "";

    const gameCategoryCondition = gameCategory
      ? `AND ec.name ILIKE '%${gameCategory.replace(/'/g, "''")}%'`
      : "";

    const searchCondition = search
      ? `AND (u.username ILIKE '%${search.replace(/'/g, "''")}%' OR u.global_name ILIKE '%${search.replace(/'/g, "''")}%')`
      : "";

    // Count total
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id ${dateCondition}
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false ${festivalCondition}
      LEFT JOIN community_events ce ON ce.id = r.event_id
      LEFT JOIN event_categories ec ON ec.id = ce.category_id ${gameCategoryCondition}
      WHERE u.deleted_at IS NULL
        AND u.banned_at IS NULL
        ${searchCondition}
    `);

    const total = Number(countResult[0]?.count ?? 0);
    const offset = (page - 1) * pageSize;

    // Main leaderboard query
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        username: string;
        global_name: string | null;
        avatar_url: string | null;
        discord_username: string | null;
        total_points: bigint;
        events_joined: bigint;
        wins: bigint;
        checked_in: bigint;
        badge_count: bigint;
        achievement_count: bigint;
      }>
    >(`
      SELECT
        u.id as user_id,
        u.username,
        u.global_name,
        u.avatar_url,
        da.username as discord_username,
        COALESCE(SUM(up.points) FILTER (WHERE up.id IS NOT NULL ${dateCondition.replace("AND up.", "AND ")}), 0) as total_points,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.id IS NOT NULL ${festivalCondition.replace("AND r.", "AND ")}), 0) as events_joined,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status IN ('APPROVED', 'CHECKED_IN') ${festivalCondition.replace("AND r.", "AND ")}), 0) as wins,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN' ${festivalCondition.replace("AND r.", "AND ")}), 0) as checked_in,
        COALESCE(COUNT(DISTINCT ub.id), 0) as badge_count,
        COALESCE(COUNT(DISTINCT ua.id), 0) as achievement_count
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
      LEFT JOIN community_events ce ON ce.id = r.event_id
      LEFT JOIN event_categories ec ON ec.id = ce.category_id
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      LEFT JOIN discord_accounts da ON da.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND u.banned_at IS NULL
        ${searchCondition}
      GROUP BY u.id, u.username, u.global_name, u.avatar_url, da.username
      ORDER BY total_points DESC, events_joined DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    // Get badge details for each user
    const userIds = rows.map((r) => r.user_id);
    let badgeMap = new Map<string, Array<{ name: string; icon: string; tier: string }>>();

    if (userIds.length > 0) {
      const badgeRows = await prisma.userBadge.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          badge: { select: { name: true, icon: true, tier: true } },
        },
        orderBy: { earnedAt: "desc" },
      });
      for (const br of badgeRows) {
        const existing = badgeMap.get(br.userId) ?? [];
        if (existing.length < 3) {
          existing.push({ name: br.badge.name, icon: br.badge.icon, tier: br.badge.tier });
          badgeMap.set(br.userId, existing);
        }
      }
    }

    // Assign ranks based on position in result
    const entries: LeaderboardEntry[] = rows.map((row, index) => {
      const globalRank = offset + index + 1;
      const eventsJoined = Number(row.events_joined);
      const checkedIn = Number(row.checked_in);
      const attendancePct = eventsJoined > 0 ? Math.round((checkedIn / eventsJoined) * 100) : 0;

      return {
        rank: globalRank,
        userId: row.user_id,
        username: row.username,
        discordUsername: row.discord_username ?? null,
        avatarUrl: row.avatar_url,
        totalPoints: Number(row.total_points),
        eventsJoined,
        wins: Number(row.wins),
        attendancePct,
        badges: Number(row.badge_count),
        achievements: Number(row.achievement_count),
        rankChange: 0, // Would need historical data
        badgeList: badgeMap.get(row.user_id) ?? [],
      };
    });

    return ok({
      entries,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Current user's leaderboard stats ────────────────────────────────────────
export async function getMyLeaderboardStats(): Promise<
  ActionResult<{
    rank: number;
    totalPoints: number;
    highestRank: number;
    rankChange: number;
    topPercentage: number;
    totalParticipants: number;
    weeklyPoints: number;
    monthlyPoints: number;
    pointsHistory: PointsHistory[];
    milestone: RankMilestone;
  }>
> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPointsResult,
      weeklyPointsResult,
      monthlyPointsResult,
      rankCount,
      totalUsersCount,
      pointsHistory,
    ] = await Promise.all([
      prisma.userPoints.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      prisma.userPoints.aggregate({
        where: { userId, createdAt: { gte: weekAgo } },
        _sum: { points: true },
      }),
      prisma.userPoints.aggregate({
        where: { userId, createdAt: { gte: monthAgo } },
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
      prisma.user.count({ where: { deletedAt: null, bannedAt: null } }),
      // Weekly points for last 8 weeks
      prisma.$queryRaw<Array<{ week_start: Date; total_points: bigint }>>`
        SELECT
          date_trunc('week', created_at) as week_start,
          SUM(points) as total_points
        FROM user_points
        WHERE user_id = ${userId}
          AND created_at >= NOW() - INTERVAL '8 weeks' GROUP BY date_trunc('week', created_at)
        ORDER BY week_start ASC
      `,
    ]);

    const totalPoints = totalPointsResult._sum.points ?? 0;
    const weeklyPoints = weeklyPointsResult._sum.points ?? 0;
    const monthlyPoints = monthlyPointsResult._sum.points ?? 0;
    const rank = Number((rankCount[0]?.count ?? 0n) + 1n);
    const topPercentage =
      totalUsersCount > 0
        ? Math.round((rank / totalUsersCount) * 100 * 10) / 10
        : 100;

    // Build points history with rank approximation
    const historyEntries: PointsHistory[] = pointsHistory.map(
      (row: { week_start: Date; total_points: bigint }, i: number) => ({
        week: new Date(row.week_start).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        points: Number(row.total_points),
        rank: Math.max(1, rank - (pointsHistory.length - 1 - i) * 2),
      })
    );

    // Get next rank milestone
    const nextRankUser = await prisma.$queryRaw<
      [{ total_points: bigint; rank_pos: bigint } | undefined]
    >`
      SELECT total_points, rank_pos FROM (
        SELECT
          user_id,
          SUM(points) as total_points,
          RANK() OVER (ORDER BY SUM(points) DESC) as rank_pos
        FROM user_points
        GROUP BY user_id
      ) ranked
      WHERE rank_pos = ${rank - 1}
      LIMIT 1
    `;

    const nextRankPoints = nextRankUser[0]
      ? Number(nextRankUser[0].total_points)
      : totalPoints + 100;
    const nextRankPosition = Math.max(1, rank - 1);
    const pointsNeeded = Math.max(0, nextRankPoints - totalPoints + 1);
    const progressPct =
      nextRankPoints > 0
        ? Math.min(100, Math.round((totalPoints / nextRankPoints) * 100))
        : 100;

    const milestone: RankMilestone = {
      currentPoints: totalPoints,
      currentRank: rank,
      nextRankPoints,
      nextRankPosition,
      progressPct,
      pointsNeeded,
    };

    return ok({
      rank,
      totalPoints,
      highestRank: rank, // Would need historical tracking
      rankChange: 0,
      topPercentage,
      totalParticipants: totalUsersCount,
      weeklyPoints,
      monthlyPoints,
      pointsHistory: historyEntries,
      milestone,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Leaderboard statistics ───────────────────────────────────────────────────
export async function getLeaderboardStats(): Promise<ActionResult<LeaderboardStats>> {
  try {
    await requireAuth();

    const [totalParticipants, pointsAgg, topUser] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null, bannedAt: null } }),
      prisma.$queryRaw<[{ avg_points: number; max_points: bigint }]>`
        SELECT
          AVG(total_points) as avg_points,
          MAX(total_points) as max_points
        FROM (
          SELECT user_id, SUM(points) as total_points
          FROM user_points
          GROUP BY user_id
        ) agg
      `,
      prisma.$queryRaw<[{ username: string }]>`
        SELECT u.username
        FROM users u
        INNER JOIN (
          SELECT user_id, SUM(points) as total_points
          FROM user_points
          GROUP BY user_id
          ORDER BY total_points DESC
          LIMIT 1
        ) top ON top.user_id = u.id
      `,
    ]);

    return ok({
      totalParticipants,
      averagePoints: Math.round(Number(pointsAgg[0]?.avg_points ?? 0)),
      highestPoints: Number(pointsAgg[0]?.max_points ?? 0),
      festivalLeader: topUser[0]?.username ?? null,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Hall of Fame preview ─────────────────────────────────────────────────────
export async function getHallOfFamePreview(): Promise<ActionResult<HallOfFameEntry[]>> {
  try {
    await requireAuth();

    const top4 = await prisma.$queryRaw<
      Array<{
        user_id: string;
        username: string;
        avatar_url: string | null;
        total_points: bigint;
        events_joined: bigint;
      }>
    >`
      SELECT
        u.id as user_id,
        u.username,
        u.avatar_url,
        COALESCE(up_agg.total_points, 0) as total_points,
        COALESCE(reg_agg.events_joined, 0) as events_joined
      FROM users u
      LEFT JOIN (
        SELECT user_id, SUM(points) as total_points
        FROM user_points
        GROUP BY user_id
      ) up_agg ON up_agg.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as events_joined
        FROM registrations
        WHERE is_deleted = false
        GROUP BY user_id
      ) reg_agg ON reg_agg.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
      ORDER BY total_points DESC
      LIMIT 4
    `;

    const roles: Array<HallOfFameEntry["role"]> = [
      "champion",
      "previous_champion",
      "most_active",
      "mvp",
    ];
    const roleLabels: Record<HallOfFameEntry["role"], string> = {
      champion: "🏆 Current Champion",
      previous_champion: "⭐ Previous Champion",
      most_active: "🔥 Most Active",
      mvp: "💎 MVP",
    };

    return ok(
      top4.map(
        (
          entry: {
            user_id: string;
            username: string;
            avatar_url: string | null;
            total_points: bigint;
            events_joined: bigint;
          },
          i: number
        ) => ({
          userId: entry.user_id,
          username: entry.username,
          avatarUrl: entry.avatar_url,
          totalPoints: Number(entry.total_points),
          role: roles[i] ?? "mvp",
          roleLabel: roleLabels[roles[i] ?? "mvp"],
        })
      )
    );
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── User's achievements for leaderboard preview ─────────────────────────────
export async function getLeaderboardAchievements(): Promise<
  ActionResult<{
    unlocked: Array<{ id: string; name: string; icon: string; category: string }>;
    milestones: Array<{
      label: string;
      icon: string;
      unlocked: boolean;
      threshold: number;
    }>;
    currentRank: number;
  }>
> {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const [userAchievements, totalPointsResult, rankCount] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId },
        select: {
          achievement: {
            select: { id: true, name: true, icon: true, category: true },
          },
        },
        orderBy: { unlockedAt: "desc" },
        take: 6,
      }),
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
    ]);

    const totalUsers = await prisma.user.count({
      where: { deletedAt: null, bannedAt: null },
    });
    const rank = Number((rankCount[0]?.count ?? 0n) + 1n);
    const topPct = totalUsers > 0 ? (rank / totalUsers) * 100 : 100;

    const rankMilestones = [
      { label: "Top 100", icon: "🎯", threshold: 100 },
      { label: "Top 50", icon: "🥉", threshold: 50 },
      { label: "Top 25", icon: "🥈", threshold: 25 },
      { label: "Top 10", icon: "🥇", threshold: 10 },
      { label: "Top 3", icon: "🏆", threshold: 3 },
      { label: "Champion", icon: "👑", threshold: 1 },
    ];

    return ok({
      unlocked: userAchievements.map(
        (ua: {
          achievement: {
            id: string;
            name: string;
            icon: string;
            category: string;
          };
        }) => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          icon: ua.achievement.icon,
          category: ua.achievement.category,
        })
      ),
      milestones: rankMilestones.map((m) => ({
        ...m,
        unlocked: rank <= m.threshold,
      })),
      currentRank: rank,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Festivals list for filter ────────────────────────────────────────────────
export async function getFestivalsForFilter(): Promise<
  ActionResult<Array<{ id: string; name: string }>>
> {
  try {
    await requireAuth();
    const festivals = await prisma.festival.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
      take: 20,
    });
    return ok(festivals);
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Game categories for filter ───────────────────────────────────────────────
export async function getGameCategoriesForFilter(): Promise<
  ActionResult<Array<{ id: string; name: string }>>
> {
  try {
    await requireAuth();
    const categories = await prisma.eventCategory.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(categories);
  } catch (error) {
    return handleActionError(error);
  }
}

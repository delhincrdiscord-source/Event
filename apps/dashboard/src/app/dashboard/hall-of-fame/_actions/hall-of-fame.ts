"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@gameverse/database";
import { handleActionError, ok, type ActionResult } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HallOfFamePlayer = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  wins: number;
  eventsJoined: number;
  attendancePct: number;
  badges: number;
  achievements: number;
  badgeList: Array<{ name: string; icon: string; tier: string }>;
  achievementList: Array<{ name: string; icon: string; category: string }>;
  festivalName: string | null;
  festivalId: string | null;
  rank: number;
  category: HallOfFameCategory;
  categoryLabel: string;
  championDate: string | null;
};

export type HallOfFameCategory =
  | "festival_champion" |"season_champion" |"most_active" |"mvp" |"best_team_player" |"community_favorite" |"best_builder" |"best_strategist";

export type SeasonArchive = {
  festivalId: string;
  festivalName: string;
  season: string;
  startDate: string;
  endDate: string;
  status: string;
  champion: { userId: string; username: string; avatarUrl: string | null; points: number } | null;
  runnerUp: { userId: string; username: string; avatarUrl: string | null; points: number } | null;
  thirdPlace: { userId: string; username: string; avatarUrl: string | null; points: number } | null;
  totalParticipants: number;
  totalEvents: number;
};

export type HallOfFameStats = {
  totalFestivals: number;
  totalChampions: number;
  totalParticipants: number;
  eventsCompleted: number;
};

export type AchievementShowcase = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  pointValue: number;
  earnedBy: number;
};

export type HallOfFameData = {
  featuredChampion: HallOfFamePlayer | null;
  topThree: HallOfFamePlayer[];
  categories: Record<HallOfFameCategory, HallOfFamePlayer[]>;
  seasonArchive: SeasonArchive[];
  achievementShowcase: AchievementShowcase[];
  stats: HallOfFameStats;
  festivals: Array<{ id: string; name: string }>;
};

// ─── Main Hall of Fame Fetch ──────────────────────────────────────────────────

export async function getHallOfFameData(filters?: {
  search?: string;
  festivalId?: string;
  category?: HallOfFameCategory | "all";
  season?: string;
}): Promise<ActionResult<HallOfFameData>> {
  try {
    await requireAuth();

    const searchTerm = filters?.search?.trim() ?? "";
    const festivalFilter = filters?.festivalId;

    // ── Fetch all festivals for archive & filter ──────────────────────────
    const festivals = await prisma.festival.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: { select: { events: { where: { isDeleted: false } } } },
      },
      orderBy: { startDate: "desc" },
    });

    // ── Stats ─────────────────────────────────────────────────────────────
    const [totalParticipants, eventsCompleted] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null, bannedAt: null } }),
      prisma.communityEvent.count({
        where: { isDeleted: false, status: { in: ["COMPLETED", "ARCHIVED"] } },
      }),
    ]);

    const stats: HallOfFameStats = {
      totalFestivals: festivals.length,
      totalChampions: Math.min(festivals.length, festivals.length),
      totalParticipants,
      eventsCompleted,
    };

    // ── Build leaderboard per festival for season archive ─────────────────
    const seasonArchive: SeasonArchive[] = [];

    for (const festival of festivals) {
      const topPlayers = await prisma.$queryRawUnsafe<
        Array<{
          user_id: string;
          username: string;
          avatar_url: string | null;
          total_points: bigint;
        }>
      >(`
        SELECT
          u.id as user_id,
          u.username,
          u.avatar_url,
          COALESCE(SUM(up.points), 0) as total_points
        FROM users u
        INNER JOIN registrations r ON r.user_id = u.id AND r.festival_id = '${festival.id}'::uuid AND r.is_deleted = false
        LEFT JOIN user_points up ON up.user_id = u.id
        WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
        GROUP BY u.id, u.username, u.avatar_url
        ORDER BY total_points DESC
        LIMIT 3
      `);

      const participantCount = await prisma.registration.count({
        where: { festivalId: festival.id, isDeleted: false },
      });

      const toPlayer = (
        row: { user_id: string; username: string; avatar_url: string | null; total_points: bigint } | undefined
      ) =>
        row
          ? {
              userId: row.user_id,
              username: row.username,
              avatarUrl: row.avatar_url,
              points: Number(row.total_points),
            }
          : null;

      seasonArchive.push({
        festivalId: festival.id,
        festivalName: festival.name,
        season: new Date(festival.startDate).getFullYear().toString(),
        startDate: festival.startDate.toISOString(),
        endDate: festival.endDate.toISOString(),
        status: festival.status,
        champion: toPlayer(topPlayers[0]),
        runnerUp: toPlayer(topPlayers[1]),
        thirdPlace: toPlayer(topPlayers[2]),
        totalParticipants: participantCount,
        totalEvents: festival._count.events,
      });
    }

    // ── Build category players ────────────────────────────────────────────
    // Festival Champions: top points overall
    const festivalChampionRows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        username: string;
        avatar_url: string | null;
        total_points: bigint;
        events_joined: bigint;
        wins: bigint;
        checked_in: bigint;
        badge_count: bigint;
        achievement_count: bigint;
        festival_name: string | null;
        festival_id: string | null;
      }>
    >(`
      SELECT
        u.id as user_id,
        u.username,
        u.avatar_url,
        COALESCE(SUM(up.points), 0) as total_points,
        COALESCE(COUNT(DISTINCT r.id), 0) as events_joined,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status IN ('APPROVED','CHECKED_IN')), 0) as wins,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN'), 0) as checked_in,
        COALESCE(COUNT(DISTINCT ub.id), 0) as badge_count,
        COALESCE(COUNT(DISTINCT ua.id), 0) as achievement_count,
        f.name as festival_name,
        f.id as festival_id
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
        ${festivalFilter ? `AND r.festival_id = '${festivalFilter}'::uuid` : ""}
      LEFT JOIN festivals f ON f.id = r.festival_id
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
        ${searchTerm ? `AND (u.username ILIKE '%${searchTerm.replace(/'/g, "''")}%')` : ""}
      GROUP BY u.id, u.username, u.avatar_url, f.name, f.id
      ORDER BY total_points DESC
      LIMIT 10
    `);

    // Most Active: most events joined
    const mostActiveRows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        username: string;
        avatar_url: string | null;
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
        u.avatar_url,
        COALESCE(SUM(up.points), 0) as total_points,
        COALESCE(COUNT(DISTINCT r.id), 0) as events_joined,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status IN ('APPROVED','CHECKED_IN')), 0) as wins,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN'), 0) as checked_in,
        COALESCE(COUNT(DISTINCT ub.id), 0) as badge_count,
        COALESCE(COUNT(DISTINCT ua.id), 0) as achievement_count
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
        ${festivalFilter ? `AND r.festival_id = '${festivalFilter}'::uuid` : ""}
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
        ${searchTerm ? `AND (u.username ILIKE '%${searchTerm.replace(/'/g, "''")}%')` : ""}
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY events_joined DESC, total_points DESC
      LIMIT 10
    `);

    // MVPs: most achievements
    const mvpRows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        username: string;
        avatar_url: string | null;
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
        u.avatar_url,
        COALESCE(SUM(up.points), 0) as total_points,
        COALESCE(COUNT(DISTINCT r.id), 0) as events_joined,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status IN ('APPROVED','CHECKED_IN')), 0) as wins,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN'), 0) as checked_in,
        COALESCE(COUNT(DISTINCT ub.id), 0) as badge_count,
        COALESCE(COUNT(DISTINCT ua.id), 0) as achievement_count
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
        ${festivalFilter ? `AND r.festival_id = '${festivalFilter}'::uuid` : ""}
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
        ${searchTerm ? `AND (u.username ILIKE '%${searchTerm.replace(/'/g, "''")}%')` : ""}
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY achievement_count DESC, total_points DESC
      LIMIT 10
    `);

    // Best Team Players: most wins (approved/checked-in)
    const bestTeamRows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        username: string;
        avatar_url: string | null;
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
        u.avatar_url,
        COALESCE(SUM(up.points), 0) as total_points,
        COALESCE(COUNT(DISTINCT r.id), 0) as events_joined,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status IN ('APPROVED','CHECKED_IN')), 0) as wins,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN'), 0) as checked_in,
        COALESCE(COUNT(DISTINCT ub.id), 0) as badge_count,
        COALESCE(COUNT(DISTINCT ua.id), 0) as achievement_count
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
        ${festivalFilter ? `AND r.festival_id = '${festivalFilter}'::uuid` : ""}
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
        ${searchTerm ? `AND (u.username ILIKE '%${searchTerm.replace(/'/g, "''")}%')` : ""}
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY wins DESC, events_joined DESC
      LIMIT 10
    `);

    // Community Favorite: most badges
    const communityRows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        username: string;
        avatar_url: string | null;
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
        u.avatar_url,
        COALESCE(SUM(up.points), 0) as total_points,
        COALESCE(COUNT(DISTINCT r.id), 0) as events_joined,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status IN ('APPROVED','CHECKED_IN')), 0) as wins,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN'), 0) as checked_in,
        COALESCE(COUNT(DISTINCT ub.id), 0) as badge_count,
        COALESCE(COUNT(DISTINCT ua.id), 0) as achievement_count
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
        ${festivalFilter ? `AND r.festival_id = '${festivalFilter}'::uuid` : ""}
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
        ${searchTerm ? `AND (u.username ILIKE '%${searchTerm.replace(/'/g, "''")}%')` : ""}
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY badge_count DESC, total_points DESC
      LIMIT 10
    `);

    // Best Builders & Best Strategists: use checked-in attendance rate
    const buildersRows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        username: string;
        avatar_url: string | null;
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
        u.avatar_url,
        COALESCE(SUM(up.points), 0) as total_points,
        COALESCE(COUNT(DISTINCT r.id), 0) as events_joined,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status IN ('APPROVED','CHECKED_IN')), 0) as wins,
        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN'), 0) as checked_in,
        COALESCE(COUNT(DISTINCT ub.id), 0) as badge_count,
        COALESCE(COUNT(DISTINCT ua.id), 0) as achievement_count
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
        ${festivalFilter ? `AND r.festival_id = '${festivalFilter}'::uuid` : ""}
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.banned_at IS NULL
        ${searchTerm ? `AND (u.username ILIKE '%${searchTerm.replace(/'/g, "''")}%')` : ""}
      GROUP BY u.id, u.username, u.avatar_url
      HAVING COUNT(DISTINCT r.id) > 0
      ORDER BY (COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'CHECKED_IN')::float / NULLIF(COUNT(DISTINCT r.id), 0)) DESC, total_points DESC
      LIMIT 10
    `);

    // ── Fetch badge/achievement details for all unique user IDs ───────────
    const allUserIds = Array.from(
      new Set([
        ...festivalChampionRows.map((r) => r.user_id),
        ...mostActiveRows.map((r) => r.user_id),
        ...mvpRows.map((r) => r.user_id),
        ...bestTeamRows.map((r) => r.user_id),
        ...communityRows.map((r) => r.user_id),
        ...buildersRows.map((r) => r.user_id),
      ])
    );

    const [badgeDetails, achievementDetails] = await Promise.all([
      allUserIds.length > 0
        ? prisma.userBadge.findMany({
            where: { userId: { in: allUserIds } },
            select: {
              userId: true,
              badge: { select: { name: true, icon: true, tier: true } },
            },
            orderBy: { earnedAt: "desc" },
          })
        : [],
      allUserIds.length > 0
        ? prisma.userAchievement.findMany({
            where: { userId: { in: allUserIds } },
            select: {
              userId: true,
              achievement: { select: { name: true, icon: true, category: true } },
            },
            orderBy: { unlockedAt: "desc" },
          })
        : [],
    ]);

    const badgeMap = new Map<string, Array<{ name: string; icon: string; tier: string }>>();
    for (const b of badgeDetails) {
      const arr = badgeMap.get(b.userId) ?? [];
      if (arr.length < 5) arr.push({ name: b.badge.name, icon: b.badge.icon, tier: b.badge.tier });
      badgeMap.set(b.userId, arr);
    }

    const achievementMap = new Map<string, Array<{ name: string; icon: string; category: string }>>();
    for (const a of achievementDetails) {
      const arr = achievementMap.get(a.userId) ?? [];
      if (arr.length < 5) arr.push({ name: a.achievement.name, icon: a.achievement.icon, category: a.achievement.category });
      achievementMap.set(a.userId, arr);
    }

    // ── Helper to map raw rows to HallOfFamePlayer ────────────────────────
    type RawPlayerRow = {
      user_id: string;
      username: string;
      avatar_url: string | null;
      total_points: bigint;
      events_joined: bigint;
      wins: bigint;
      checked_in: bigint;
      badge_count: bigint;
      achievement_count: bigint;
      festival_name?: string | null;
      festival_id?: string | null;
    };

    const mapPlayer = (
      row: RawPlayerRow,
      rank: number,
      category: HallOfFameCategory,
      categoryLabel: string
    ): HallOfFamePlayer => {
      const eventsJoined = Number(row.events_joined);
      const checkedIn = Number(row.checked_in);
      const attendancePct = eventsJoined > 0 ? Math.round((checkedIn / eventsJoined) * 100) : 0;
      return {
        userId: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url,
        totalPoints: Number(row.total_points),
        wins: Number(row.wins),
        eventsJoined,
        attendancePct,
        badges: Number(row.badge_count),
        achievements: Number(row.achievement_count),
        badgeList: badgeMap.get(row.user_id) ?? [],
        achievementList: achievementMap.get(row.user_id) ?? [],
        festivalName: row.festival_name ?? null,
        festivalId: row.festival_id ?? null,
        rank,
        category,
        categoryLabel,
        championDate: null,
      };
    };

    const categories: Record<HallOfFameCategory, HallOfFamePlayer[]> = {
      festival_champion: festivalChampionRows.map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "festival_champion", "🏆 Festival Champion")
      ),
      season_champion: festivalChampionRows.slice(0, 5).map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "season_champion", "🌟 Season Champion")
      ),
      most_active: mostActiveRows.map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "most_active", "🔥 Most Active")
      ),
      mvp: mvpRows.map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "mvp", "💎 MVP")
      ),
      best_team_player: bestTeamRows.map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "best_team_player", "🤝 Best Team Player")
      ),
      community_favorite: communityRows.map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "community_favorite", "❤️ Community Favorite")
      ),
      best_builder: buildersRows.map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "best_builder", "🏗️ Best Builder")
      ),
      best_strategist: buildersRows.slice().reverse().map((r, i) =>
        mapPlayer(r as RawPlayerRow, i + 1, "best_strategist", "🧠 Best Strategist")
      ),
    };

    // ── Featured champion & top 3 ─────────────────────────────────────────
    const featuredChampion = categories.festival_champion[0] ?? null;
    const topThree = categories.festival_champion.slice(0, 3);

    // ── Achievement showcase ──────────────────────────────────────────────
    const topAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        category: true,
        pointValue: true,
        userAchievements: { select: { userId: true } },
      },
      orderBy: { pointValue: "desc" },
      take: 12,
    });

    const achievementShowcase: AchievementShowcase[] = topAchievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      pointValue: a.pointValue,
      earnedBy: a.userAchievements.length,
    }));

    return ok({
      featuredChampion,
      topThree,
      categories,
      seasonArchive,
      achievementShowcase,
      stats,
      festivals: festivals.map((f) => ({ id: f.id, name: f.name })),
    });
  } catch (error) {
    return handleActionError(error);
  }
}

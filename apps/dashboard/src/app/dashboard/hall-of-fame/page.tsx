"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Trophy, Medal, Star, Search, Filter, Users, Flame, Award, Heart, Hammer, Brain, Target, Calendar, Sparkles, Gamepad2, X, BarChart3, CheckCircle2,  } from "lucide-react";

import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";
import { Separator } from "@gameverse/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";

import {
  getHallOfFameData,
  type HallOfFameData,
  type HallOfFamePlayer,
  type HallOfFameCategory,
  type SeasonArchive,
  type AchievementShowcase,
} from "./_actions/hall-of-fame";

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const stagger = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  HallOfFameCategory,
  { label: string; emoji: string; icon: React.ReactNode; gradient: string; description: string }
> = {
  festival_champion: {
    label: "Festival Champions",
    emoji: "🏆",
    icon: <Trophy className="h-5 w-5" />,
    gradient: "from-yellow-500/20 to-amber-500/10",
    description: "The highest-scoring players across all festivals",
  },
  season_champion: {
    label: "Season Champions",
    emoji: "🌟",
    icon: <Star className="h-5 w-5" />,
    gradient: "from-blue-500/20 to-indigo-500/10",
    description: "Champions of individual festival seasons",
  },
  most_active: {
    label: "Most Active Players",
    emoji: "🔥",
    icon: <Flame className="h-5 w-5" />,
    gradient: "from-orange-500/20 to-red-500/10",
    description: "Players who participated in the most events",
  },
  mvp: {
    label: "MVPs",
    emoji: "💎",
    icon: <Award className="h-5 w-5" />,
    gradient: "from-purple-500/20 to-violet-500/10",
    description: "Most Valuable Players with outstanding achievements",
  },
  best_team_player: {
    label: "Best Team Players",
    emoji: "🤝",
    icon: <Users className="h-5 w-5" />,
    gradient: "from-green-500/20 to-emerald-500/10",
    description: "Players who excelled in team-based events",
  },
  community_favorite: {
    label: "Community Favorites",
    emoji: "❤️",
    icon: <Heart className="h-5 w-5" />,
    gradient: "from-pink-500/20 to-rose-500/10",
    description: "Beloved players with the most community badges",
  },
  best_builder: {
    label: "Best Builders",
    emoji: "🏗️",
    icon: <Hammer className="h-5 w-5" />,
    gradient: "from-cyan-500/20 to-teal-500/10",
    description: "Players with the highest attendance rates",
  },
  best_strategist: {
    label: "Best Strategists",
    emoji: "🧠",
    icon: <Brain className="h-5 w-5" />,
    gradient: "from-indigo-500/20 to-blue-500/10",
    description: "Players who mastered strategic gameplay",
  },
};

const CATEGORY_TABS: Array<{ value: HallOfFameCategory | "all"; label: string; emoji: string }> = [
  { value: "all", label: "All", emoji: "👑" },
  { value: "festival_champion", label: "Festival Champions", emoji: "🏆" },
  { value: "season_champion", label: "Season Champions", emoji: "🌟" },
  { value: "most_active", label: "Most Active", emoji: "🔥" },
  { value: "mvp", label: "MVPs", emoji: "💎" },
  { value: "best_team_player", label: "Best Team", emoji: "🤝" },
  { value: "community_favorite", label: "Community", emoji: "❤️" },
  { value: "best_builder", label: "Builders", emoji: "🏗️" },
  { value: "best_strategist", label: "Strategists", emoji: "🧠" },
];

// ─── Avatar Component ─────────────────────────────────────────────────────────
function PlayerAvatar({
  username,
  avatarUrl,
  size = "md",
  ring,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  ring?: string;
}) {
  const sizeMap = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
    "2xl": "h-28 w-28 text-3xl",
  };
  const cls = `${sizeMap[size]} ${ring ?? ""} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 font-bold text-primary`;
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeMap[size]} ${ring ?? ""} rounded-full object-cover`}
      />
    );
  }
  return <div className={cls}>{username.charAt(0).toUpperCase()}</div>;
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────
function HallOfFameSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Featured champion skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <Skeleton className="h-28 w-28 rounded-full shrink-0" />
          <div className="flex-1 space-y-3 text-center md:text-left">
            <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Podium skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-6 flex flex-col items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/10">
          <Crown className="h-10 w-10 text-yellow-500/60" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground">No Hall of Fame entries yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The Hall of Fame will be populated as participants earn points and complete events across GameVerse Festival seasons.
      </p>
      <Link
        href="/dashboard/events"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Gamepad2 className="h-4 w-4" />
        Browse Events
      </Link>
    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <motion.div
      variants={stagger}
      className={`relative overflow-hidden rounded-xl border border-border/50 bg-card p-5`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({ player }: { player: HallOfFamePlayer }) {
  const rankColors: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-slate-400",
    3: "text-amber-600",
  };
  const rankEmojis: Record<number, string> = { 1: "👑", 2: "⭐", 3: "🥉" };

  return (
    <motion.div
      variants={stagger}
      className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {player.rank <= 3 && (
        <div className="absolute right-3 top-3 text-xl">{rankEmojis[player.rank]}</div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} size="md" />
          <div
            className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs font-bold ${rankColors[player.rank] ?? "text-muted-foreground"}`}
          >
            #{player.rank}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{player.username}</p>
          {player.festivalName && (
            <p className="truncate text-xs text-muted-foreground">{player.festivalName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-bold text-primary">{player.totalPoints.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Points</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-bold text-foreground">{player.wins}</p>
          <p className="text-[10px] text-muted-foreground">Wins</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-bold text-foreground">{player.attendancePct}%</p>
          <p className="text-[10px] text-muted-foreground">Attend.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {player.badgeList.slice(0, 3).map((b, i) => (
          <span
            key={i}
            title={b.name}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm"
          >
            {b.icon}
          </span>
        ))}
        {player.badges > 3 && (
          <span className="flex h-6 items-center rounded-full bg-muted px-2 text-[10px] text-muted-foreground">
            +{player.badges - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Award className="h-3 w-3" />
          {player.achievements} achievements
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {player.eventsJoined} events
        </span>
      </div>
    </motion.div>
  );
}

// ─── Featured Champion ────────────────────────────────────────────────────────
function FeaturedChampion({ player }: { player: HallOfFamePlayer }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent p-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent" />
      <div className="relative">
        <div className="mb-6 flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
            Featured Champion
          </span>
        </div>
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="relative shrink-0">
            <PlayerAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              size="2xl"
              ring="ring-4 ring-yellow-500/40"
            />
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-xl shadow-lg">
              👑
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{player.username}</h2>
            {player.festivalName && (
              <p className="mt-1 text-base text-muted-foreground">{player.festivalName}</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
                🏆 Festival Champion
              </Badge>
              <Badge variant="secondary">🎖️ {player.badges} Badges</Badge>
              <Badge variant="secondary">🏅 {player.achievements} Achievements</Badge>
              {player.badgeList.slice(0, 2).map((b, i) => (
                <Badge key={i} variant="outline" className="gap-1">
                  <span>{b.icon}</span>
                  <span>{b.name}</span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{player.totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Points</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{player.wins}</p>
              <p className="text-xs text-muted-foreground mt-1">Wins</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{player.eventsJoined}</p>
              <p className="text-xs text-muted-foreground mt-1">Events</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Top 3 Podium ─────────────────────────────────────────────────────────────
function TopThreePodium({ players }: { players: HallOfFamePlayer[] }) {
  if (players.length < 1) return null;

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const podiumConfig = [
    {
      rank: 2,
      label: "Runner Up",
      emoji: "⭐",
      height: "h-24",
      border: "border-slate-400/30",
      bg: "from-slate-400/10 to-transparent",
      textColor: "text-slate-400",
    },
    {
      rank: 1,
      label: "Champion",
      emoji: "👑",
      height: "h-32",
      border: "border-yellow-500/40",
      bg: "from-yellow-500/15 to-transparent",
      textColor: "text-yellow-500",
    },
    {
      rank: 3,
      label: "Third Place",
      emoji: "🥉",
      height: "h-20",
      border: "border-amber-600/30",
      bg: "from-amber-600/10 to-transparent",
      textColor: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {podiumOrder.map((idx, pos) => {
        const player = players[idx];
        const config = podiumConfig[pos];
        if (!player || !config) return <div key={pos} />;

        return (
          <motion.div
            key={player.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pos * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden rounded-xl border ${config.border} bg-gradient-to-b ${config.bg} p-4 sm:p-6 flex flex-col items-center text-center`}
          >
            <span className="text-2xl sm:text-3xl mb-3">{config.emoji}</span>
            <PlayerAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              size="lg"
              ring={`ring-2 ${config.rank === 1 ? "ring-yellow-500/50" : config.rank === 2 ? "ring-slate-400/40" : "ring-amber-600/40"}`}
            />
            <h3 className="mt-3 font-bold text-foreground text-sm sm:text-base truncate max-w-full">
              {player.username}
            </h3>
            <p className={`text-xs font-medium ${config.textColor} mt-0.5`}>{config.label}</p>
            <p className="mt-2 text-lg sm:text-xl font-bold text-primary">
              {player.totalPoints.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">points</p>
            <div className={`mt-3 w-full ${config.height} rounded-b-lg bg-gradient-to-t ${config.bg} flex items-end justify-center pb-2`}>
              <span className={`text-xs font-bold ${config.textColor}`}>#{config.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────
function CategorySection({
  category,
  players,
}: {
  category: HallOfFameCategory;
  players: HallOfFamePlayer[];
}) {
  const config = CATEGORY_CONFIG[category];
  if (players.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} border border-border/50`}>
          <span className="text-lg">{config.emoji}</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{config.label}</h3>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {players.slice(0, 8).map((player) => (
          <PlayerCard key={`${category}-${player.userId}`} player={player} />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Season Archive Card ──────────────────────────────────────────────────────
function SeasonCard({ season }: { season: SeasonArchive }) {
  const statusColors: Record<string, string> = {
    LIVE: "bg-green-500/20 text-green-600 dark:text-green-400",
    COMPLETED: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    UPCOMING: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    ARCHIVED: "bg-slate-500/20 text-slate-500",
    DRAFT: "bg-slate-500/20 text-slate-500",
  };

  return (
    <motion.div
      variants={stagger}
      className="rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-foreground">{season.festivalName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Season {season.season}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[season.status] ?? statusColors.ARCHIVED}`}>
          {season.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {season.champion && (
          <div className="flex items-center gap-2">
            <span className="text-base">👑</span>
            <div className="flex items-center gap-2 min-w-0">
              <PlayerAvatar username={season.champion.username} avatarUrl={season.champion.avatarUrl} size="xs" />
              <span className="text-sm font-medium truncate">{season.champion.username}</span>
              <span className="text-xs text-primary ml-auto shrink-0">{season.champion.points.toLocaleString()} pts</span>
            </div>
          </div>
        )}
        {season.runnerUp && (
          <div className="flex items-center gap-2">
            <span className="text-base">⭐</span>
            <div className="flex items-center gap-2 min-w-0">
              <PlayerAvatar username={season.runnerUp.username} avatarUrl={season.runnerUp.avatarUrl} size="xs" />
              <span className="text-sm text-muted-foreground truncate">{season.runnerUp.username}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{season.runnerUp.points.toLocaleString()} pts</span>
            </div>
          </div>
        )}
        {season.thirdPlace && (
          <div className="flex items-center gap-2">
            <span className="text-base">🥉</span>
            <div className="flex items-center gap-2 min-w-0">
              <PlayerAvatar username={season.thirdPlace.username} avatarUrl={season.thirdPlace.avatarUrl} size="xs" />
              <span className="text-sm text-muted-foreground truncate">{season.thirdPlace.username}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{season.thirdPlace.points.toLocaleString()} pts</span>
            </div>
          </div>
        )}
        {!season.champion && !season.runnerUp && !season.thirdPlace && (
          <p className="text-xs text-muted-foreground italic">No participants yet</p>
        )}
      </div>

      <Separator className="mb-3" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {season.totalParticipants} participants
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {season.totalEvents} events
        </span>
      </div>
    </motion.div>
  );
}

// ─── Achievement Showcase ─────────────────────────────────────────────────────
function AchievementCard({ achievement }: { achievement: AchievementShowcase }) {
  return (
    <motion.div
      variants={stagger}
      className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl">
        {achievement.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground truncate">{achievement.name}</p>
        {achievement.description && (
          <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            {achievement.pointValue} pts
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {achievement.earnedBy} earned
          </span>
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {achievement.category}
      </Badge>
    </motion.div>
  );
}

// ─── Highlights Section ───────────────────────────────────────────────────────
function HighlightsSection({ data }: { data: HallOfFameData }) {
  const highlights = [
    {
      title: "Best Event Moments",
      emoji: "🎮",
      description: "Top moments from completed events",
      items: data.seasonArchive
        .filter((s) => s.champion)
        .slice(0, 3)
        .map((s) => ({
          label: s.festivalName,
          value: s.champion?.username ?? "—",
          sub: `${s.totalEvents} events`,
        })),
    },
    {
      title: "Event Winners",
      emoji: "🏅",
      description: "Champions from each festival",
      items: data.seasonArchive
        .filter((s) => s.champion)
        .slice(0, 3)
        .map((s) => ({
          label: s.champion?.username ?? "—",
          value: `${s.champion?.points.toLocaleString() ?? 0} pts`,
          sub: s.festivalName,
        })),
    },
    {
      title: "Featured Clips",
      emoji: "🎬",
      description: "Memorable gameplay highlights",
      items: data.categories.most_active.slice(0, 3).map((p) => ({
        label: p.username,
        value: `${p.eventsJoined} events`,
        sub: `${p.attendancePct}% attendance`,
      })),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {highlights.map((h) => (
        <div key={h.title} className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{h.emoji}</span>
            <div>
              <h4 className="font-semibold text-foreground text-sm">{h.title}</h4>
              <p className="text-xs text-muted-foreground">{h.description}</p>
            </div>
          </div>
          <div className="space-y-3">
            {h.items.length > 0 ? (
              h.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0 ml-2">{item.value}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No data yet</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HallOfFamePage() {
  const [data, setData] = useState<HallOfFameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters & search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HallOfFameCategory | "all">("all");
  const [selectedFestival, setSelectedFestival] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<HallOfFameCategory | "all">("all");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(
    (opts?: { search?: string; festivalId?: string; category?: HallOfFameCategory | "all" }) => {
      startTransition(async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await getHallOfFameData({
            search: opts?.search ?? debouncedSearch,
            festivalId: opts?.festivalId ?? (selectedFestival !== "all" ? selectedFestival : undefined),
            category: opts?.category ?? selectedCategory,
          });
          if (!result.success) {
            setError(result.error ?? "Failed to load Hall of Fame");
            return;
          }
          setData(result.data);
        } catch {
          setError("Something went wrong loading the Hall of Fame");
        } finally {
          setIsLoading(false);
        }
      });
    },
    [debouncedSearch, selectedFestival, selectedCategory]
  );

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, selectedFestival]);

  const handleCategoryChange = (cat: HallOfFameCategory | "all") => {
    setActiveTab(cat);
    setSelectedCategory(cat);
  };

  const hasData = data && (
    data.featuredChampion !== null ||
    data.topThree.length > 0 ||
    Object.values(data.categories).some((arr) => arr.length > 0)
  );

  // Filter categories to display
  const categoriesToShow: HallOfFameCategory[] =
    activeTab === "all"
      ? (Object.keys(CATEGORY_CONFIG) as HallOfFameCategory[])
      : [activeTab];

  // Filter season archive by selected season
  const filteredSeasons = data?.seasonArchive.filter((s) =>
    selectedSeason === "all" ? true : s.season === selectedSeason
  ) ?? [];

  const uniqueSeasons = Array.from(
    new Set(data?.seasonArchive.map((s) => s.season) ?? [])
  ).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-10 pb-12">
      {/* ── Header ── */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="text-4xl">👑</span>
            Hall of Fame
          </h1>
          <p className="mt-2 text-muted-foreground">
            Celebrate the greatest players and unforgettable moments from GameVerse Festival.
          </p>
        </motion.div>

        {/* Stats */}
        {!isLoading && data && (
          <motion.div
            variants={container}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            <StatCard
              label="Total Festivals"
              value={data.stats.totalFestivals}
              icon={<Trophy className="h-4 w-4 text-yellow-500" />}
              gradient="from-yellow-500/15 to-amber-500/5"
            />
            <StatCard
              label="Total Champions"
              value={data.stats.totalChampions}
              icon={<Crown className="h-4 w-4 text-primary" />}
              gradient="from-primary/15 to-primary/5"
            />
            <StatCard
              label="Total Participants"
              value={data.stats.totalParticipants}
              icon={<Users className="h-4 w-4 text-blue-500" />}
              gradient="from-blue-500/15 to-blue-500/5"
            />
            <StatCard
              label="Events Completed"
              value={data.stats.eventsCompleted}
              icon={<BarChart3 className="h-4 w-4 text-green-500" />}
              gradient="from-green-500/15 to-green-500/5"
            />
          </motion.div>
        )}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Search & Filters ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by player, festival, or season..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={selectedFestival} onValueChange={setSelectedFestival}>
            <SelectTrigger className="w-[160px] bg-card border-border/50">
              <SelectValue placeholder="Festival" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Festivals</SelectItem>
              {data?.festivals.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[130px] bg-card border-border/50">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {uniqueSeasons.map((s) => (
                <SelectItem key={s} value={s}>
                  Season {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ── Category Tabs ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleCategoryChange(tab.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Content ── */}
      {isLoading ? (
        <HallOfFameSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <span className="text-4xl mb-4">⚠️</span>
          <h3 className="text-lg font-semibold">Failed to load Hall of Fame</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-12"
          >
            {/* Featured Champion */}
            {data.featuredChampion && (activeTab === "all" || activeTab === "festival_champion") && (
              <section>
                <FeaturedChampion player={data.featuredChampion} />
              </section>
            )}

            {/* Top 3 Podium */}
            {data.topThree.length >= 2 && (activeTab === "all" || activeTab === "festival_champion") && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Top 3 Podium</h2>
                </div>
                <TopThreePodium players={data.topThree} />
              </section>
            )}

            {/* Category Sections */}
            <section className="space-y-12">
              {categoriesToShow.map((cat) => {
                const players = data.categories[cat] ?? [];
                if (players.length === 0) return null;
                return (
                  <CategorySection key={cat} category={cat} players={players} />
                );
              })}
            </section>

            {/* Achievements Showcase */}
            {(activeTab === "all" || activeTab === "mvp") && data.achievementShowcase.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Achievements Showcase</h2>
                    <p className="text-sm text-muted-foreground">Legendary achievements earned by participants</p>
                  </div>
                </div>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {data.achievementShowcase.map((a) => (
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </motion.div>
              </section>
            )}

            {/* Highlights */}
            {activeTab === "all" && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Highlights</h2>
                    <p className="text-sm text-muted-foreground">Best moments, event winners, and featured clips</p>
                  </div>
                </div>
                <HighlightsSection data={data} />
              </section>
            )}

            {/* Season Archive */}
            {activeTab === "all" && filteredSeasons.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Season Archive</h2>
                      <p className="text-sm text-muted-foreground">All previous GameVerse Festival seasons</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{filteredSeasons.length} seasons</Badge>
                </div>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredSeasons.map((season) => (
                    <SeasonCard key={season.festivalId} season={season} />
                  ))}
                </motion.div>
              </section>
            )}

            {/* Empty for filtered category */}
            {activeTab !== "all" && (data.categories[activeTab as HallOfFameCategory] ?? []).length === 0 && (
              <EmptyState />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

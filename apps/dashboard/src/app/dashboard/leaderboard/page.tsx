"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Crown,
  Flame,
  Star,
  Target,
  Users,
  BarChart3,
  Award,
  Zap,
  Medal,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import {
  getFullLeaderboard,
  getMyLeaderboardStats,
  getLeaderboardStats,
  getHallOfFamePreview,
  getLeaderboardAchievements,
  getFestivalsForFilter,
  getGameCategoriesForFilter,
  type LeaderboardEntry,
  type LeaderboardFilters,
} from "./_actions/leaderboard";
import { getCurrentUser } from "@/app/dashboard/_actions/user";

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const stagger = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "festival" | "weekly" | "monthly" | "overall" | "friends";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function AvatarInitials({
  name,
  avatarUrl,
  size = "md",
  ring,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: string;
}) {
  const initials = name
    .split(/[\s_]/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizeClass = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl",
  }[size];
  const ringClass = ring ?? "ring-2 ring-[var(--border)]";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ${ringClass} shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-bold text-white ${ringClass}`}
    >
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-lg ring-1 ring-yellow-500/40">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400/20 text-lg ring-1 ring-slate-400/40">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600/20 text-lg ring-1 ring-amber-600/40">
        🥉
      </span>
    );
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-bold text-[var(--muted-foreground)]">
      #{rank}
    </span>
  );
}

function RankChangeIndicator({ change }: { change: number }) {
  if (change > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-500">
        <TrendingUp className="h-3 w-3" />+{change}
      </span>
    );
  if (change < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs text-[var(--muted-foreground)]">
      <Minus className="h-3 w-3" />
    </span>
  );
}

function TierColor(tier: string) {
  const map: Record<string, string> = {
    BRONZE: "bg-amber-700/20 text-amber-600 border-amber-700/30",
    SILVER: "bg-slate-400/20 text-slate-400 border-slate-400/30",
    GOLD: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    PLATINUM: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
    DIAMOND: "bg-violet-400/20 text-violet-400 border-violet-400/30",
    MASTER: "bg-rose-400/20 text-rose-400 border-rose-400/30",
  };
  return map[tier?.toUpperCase()] ?? "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[var(--muted)] ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <Sk className="mb-3 h-3 w-20" />
      <Sk className="mb-2 h-8 w-24" />
      <Sk className="h-3 w-32" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <Sk className="h-8 w-8 rounded-full" />
      <Sk className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Sk className="h-4 w-32" />
        <Sk className="h-3 w-20" />
      </div>
      <Sk className="h-5 w-16" />
      <Sk className="hidden h-4 w-10 md:block" />
      <Sk className="hidden h-4 w-10 md:block" />
      <Sk className="hidden h-4 w-12 md:block" />
      <Sk className="hidden h-4 w-8 md:block" />
    </div>
  );
}

// ─── Podium Card ──────────────────────────────────────────────────────────────
function PodiumCard({
  entry,
  position,
  isMe,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  isMe: boolean;
}) {
  const configs = {
    1: {
      emoji: "🥇",
      height: "pt-0",
      glow: "shadow-yellow-500/20",
      border: "border-yellow-500/40",
      bg: "from-yellow-500/10 via-yellow-500/5 to-transparent",
      label: "1st Place",
      scale: "scale-105",
    },
    2: {
      emoji: "🥈",
      height: "pt-6",
      glow: "shadow-slate-400/20",
      border: "border-slate-400/30",
      bg: "from-slate-400/10 via-slate-400/5 to-transparent",
      label: "2nd Place",
      scale: "scale-100",
    },
    3: {
      emoji: "🥉",
      height: "pt-6",
      glow: "shadow-amber-600/20",
      border: "border-amber-600/30",
      bg: "from-amber-600/10 via-amber-600/5 to-transparent",
      label: "3rd Place",
      scale: "scale-100",
    },
  };
  const cfg = configs[position];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: position * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${cfg.height} ${cfg.scale}`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border ${cfg.border} bg-gradient-to-b ${cfg.bg} p-5 text-center shadow-lg ${cfg.glow} ${
          isMe ? "ring-2 ring-violet-500/60" : ""
        }`}
      >
        {isMe && (
          <div className="absolute right-2 top-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/30">
            YOU
          </div>
        )}
        <div className="mb-1 text-4xl">{cfg.emoji}</div>
        <div className="mb-3 flex justify-center">
          <AvatarInitials
            name={entry.username}
            avatarUrl={entry.avatarUrl}
            size="lg"
            ring={`ring-2 ${cfg.border}`}
          />
        </div>
        <h3 className="truncate text-base font-bold text-[var(--foreground)]">
          {entry.username}
        </h3>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{cfg.label}</p>
        <p className="mt-2 text-2xl font-black text-[var(--foreground)]">
          {entry.totalPoints.toLocaleString()}
          <span className="ml-1 text-sm font-normal text-[var(--muted-foreground)]">pts</span>
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {entry.badgeList.slice(0, 2).map((b, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${TierColor(b.tier)}`}
            >
              {b.icon} {b.name}
            </span>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Medal className="h-3 w-3" />
            {entry.eventsJoined}
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {entry.wins}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {entry.badges}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("festival");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [festivalFilter, setFestivalFilter] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [myStats, setMyStats] = useState<Awaited<ReturnType<typeof getMyLeaderboardStats>>["data"] | null>(null);
  const [lbStats, setLbStats] = useState<Awaited<ReturnType<typeof getLeaderboardStats>>["data"] | null>(null);
  const [hofEntries, setHofEntries] = useState<Awaited<ReturnType<typeof getHallOfFamePreview>>["data"] | null>(null);
  const [achievements, setAchievements] = useState<Awaited<ReturnType<typeof getLeaderboardAchievements>>["data"] | null>(null);
  const [festivals, setFestivals] = useState<Array<{ id: string; name: string }>>([]);
  const [gameCategories, setGameCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  // Load static data once
  useEffect(() => {
    async function loadStatic() {
      setLoadingStats(true);
      setLoadingSidebar(true);
      try {
        const [statsRes, hofRes, achRes, festivalsRes, gamesRes, userRes] =
          await Promise.all([
            getLeaderboardStats(),
            getHallOfFamePreview(),
            getLeaderboardAchievements(),
            getFestivalsForFilter(),
            getGameCategoriesForFilter(),
            getCurrentUser(),
          ]);
        if (statsRes.success) setLbStats(statsRes.data);
        if (hofRes.success) setHofEntries(hofRes.data);
        if (achRes.success) setAchievements(achRes.data);
        if (festivalsRes.success) setFestivals(festivalsRes.data);
        if (gamesRes.success) setGameCategories(gamesRes.data);
        if (userRes.success && userRes.data) setCurrentUserId(userRes.data.id);
      } finally {
        setLoadingStats(false);
        setLoadingSidebar(false);
      }
    }
    async function loadMyStats() {
      const res = await getMyLeaderboardStats();
      if (res.success) setMyStats(res.data);
    }
    loadStatic();
    loadMyStats();
  }, []);

  // Load table when filters change
  const loadTable = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingTable(true);
      else setRefreshing(true);
      try {
        const filters: LeaderboardFilters = {
          tab: activeTab === "friends" ? "overall" : activeTab,
          search: debouncedSearch,
          festivalId: festivalFilter || undefined,
          gameCategory: gameFilter || undefined,
          page,
          pageSize: PAGE_SIZE,
        };
        const res = await getFullLeaderboard(filters);
        if (res.success) {
          setEntries(res.data.entries);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      } finally {
        setLoadingTable(false);
        setRefreshing(false);
      }
    },
    [activeTab, debouncedSearch, festivalFilter, gameFilter, page]
  );

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  // Live refresh every 60s
  useEffect(() => {
    const id = setInterval(() => loadTable(true), 60000);
    return () => clearInterval(id);
  }, [loadTable]);

  const top3 = entries.slice(0, 3);
  const podiumOrder: Array<0 | 1 | 2> = [1, 0, 2]; // 2nd, 1st, 3rd

  const tabs: Array<{ id: Tab; label: string; emoji: string }> = [
    { id: "festival", label: "Festival", emoji: "🎮" },
    { id: "weekly", label: "Weekly", emoji: "📅" },
    { id: "monthly", label: "Monthly", emoji: "📆" },
    { id: "overall", label: "Overall", emoji: "🌐" },
    { id: "friends", label: "Friends", emoji: "👥" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={fadeUp}>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
            🏆 Leaderboard
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Track your ranking and compete with the best players in GameVerse Festival.
          </p>
        </motion.div>
        <motion.button
          variants={fadeUp}
          onClick={() => loadTable(true)}
          disabled={refreshing}
          className="flex items-center gap-2 self-start rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Live Updates"}
        </motion.button>
      </motion.div>

      {/* ── Summary Stat Cards ──────────────────────────────────────────────── */}
      {loadingStats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : myStats ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {[
            {
              label: "Current Rank",
              value: `#${myStats.rank.toLocaleString()}`,
              sub: `of ${myStats.totalParticipants.toLocaleString()} players`,
              icon: <Trophy className="h-4 w-4" />,
              color: "text-yellow-500",
              bg: "bg-yellow-500/10",
            },
            {
              label: "Total Points",
              value: myStats.totalPoints.toLocaleString(),
              sub: `+${myStats.weeklyPoints} this week`,
              icon: <Star className="h-4 w-4" />,
              color: "text-violet-500",
              bg: "bg-violet-500/10",
            },
            {
              label: "Highest Rank",
              value: `#${myStats.highestRank}`,
              sub: "All-time best",
              icon: <Crown className="h-4 w-4" />,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              label: "Rank Change",
              value:
                myStats.rankChange > 0
                  ? `▲ +${myStats.rankChange}`
                  : myStats.rankChange < 0
                  ? `▼ ${myStats.rankChange}`
                  : "— Stable",
              sub: "This week",
              icon: <TrendingUp className="h-4 w-4" />,
              color:
                myStats.rankChange > 0
                  ? "text-emerald-500"
                  : myStats.rankChange < 0
                  ? "text-red-500" :"text-[var(--muted-foreground)]",
              bg:
                myStats.rankChange > 0
                  ? "bg-emerald-500/10"
                  : myStats.rankChange < 0
                  ? "bg-red-500/10" :"bg-[var(--muted)]",
            },
            {
              label: "Top Percentage",
              value: `Top ${myStats.topPercentage}%`,
              sub: "Global ranking",
              icon: <Target className="h-4 w-4" />,
              color: "text-cyan-500",
              bg: "bg-cyan-500/10",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={stagger}
              className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className={`mb-2 inline-flex rounded-lg p-1.5 ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{card.label}</p>
              <p className={`mt-0.5 text-xl font-black ${card.color}`}>{card.value}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{card.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      {/* ── Tabs + Filters ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "friends") return; // future
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : tab.id === "friends" ?"cursor-not-allowed text-[var(--muted-foreground)]/50" :"text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.id === "friends" && (
                <span className="rounded-full bg-[var(--muted)] px-1 py-0.5 text-[9px] font-bold uppercase text-[var(--muted-foreground)]">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search username, Discord…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>
        <select
          value={festivalFilter}
          onChange={(e) => { setFestivalFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        >
          <option value="">All Festivals</option>
          {festivals.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          value={gameFilter}
          onChange={(e) => { setGameFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        >
          <option value="">All Games</option>
          {gameCategories.map((g) => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
        {(festivalFilter || gameFilter || debouncedSearch) && (
          <button
            onClick={() => {
              setFestivalFilter("");
              setGameFilter("");
              setSearch("");
              setPage(1);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      {loadingTable ? (
        <div className="space-y-3">
          {/* Podium skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <Sk className="mx-auto mb-3 h-10 w-10 rounded-full" />
                <Sk className="mx-auto mb-2 h-5 w-24" />
                <Sk className="mx-auto h-7 w-16" />
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : entries.length === 0 ? (
        /* ── Empty State ─────────────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-20 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)] text-5xl">
            🏟️
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">No Rankings Yet</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
            {debouncedSearch
              ? `No players found matching "${debouncedSearch}". Try a different search.`
              : "Rankings will appear once participants start earning points. Join events to climb the leaderboard!"}
          </p>
          {debouncedSearch && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 rounded-xl bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-500 hover:bg-violet-500/20"
            >
              Clear Search
            </button>
          )}
        </motion.div>
      ) : (
        <>
          {/* ── Top 3 Podium ─────────────────────────────────────────────── */}
          {top3.length >= 3 && page === 1 && !debouncedSearch && (
            <div className="grid grid-cols-3 items-end gap-3">
              {podiumOrder.map((idx) => {
                const entry = top3[idx];
                if (!entry) return null;
                const pos = (idx + 1) as 1 | 2 | 3;
                return (
                  <PodiumCard
                    key={entry.userId}
                    entry={entry}
                    position={pos}
                    isMe={entry.userId === currentUserId}
                  />
                );
              })}
            </div>
          )}

          {/* ── Leaderboard Table ─────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            {/* Table header */}
            <div className="hidden grid-cols-[2.5rem_1fr_5rem_4rem_4rem_5rem_4rem_6rem] items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] md:grid">
              <span className="text-center">#</span>
              <span>Participant</span>
              <span className="text-right">Points</span>
              <span className="text-right">Events</span>
              <span className="text-right">Wins</span>
              <span className="text-right">Attend %</span>
              <span className="text-center">Δ Rank</span>
              <span>Badges</span>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-[var(--border)]"
            >
              <AnimatePresence mode="popLayout">
                {entries.map((entry) => {
                  const isMe = entry.userId === currentUserId;
                  return (
                    <motion.div
                      key={entry.userId}
                      variants={stagger}
                      layout
                      className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 px-4 py-3 transition-colors hover:bg-[var(--muted)]/30 md:grid-cols-[2.5rem_1fr_5rem_4rem_4rem_5rem_4rem_6rem] ${
                        isMe
                          ? "bg-violet-500/5 ring-1 ring-inset ring-violet-500/20"
                          : ""
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex justify-center">
                        <RankBadge rank={entry.rank} />
                      </div>

                      {/* Participant */}
                      <div className="flex min-w-0 items-center gap-2.5">
                        <AvatarInitials
                          name={entry.username}
                          avatarUrl={entry.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-[var(--foreground)]">
                              {entry.username}
                            </span>
                            {isMe && (
                              <span className="shrink-0 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-400">
                                You
                              </span>
                            )}
                          </div>
                          {entry.discordUsername && (
                            <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                              {entry.discordUsername}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <span className="text-right text-sm font-black text-[var(--foreground)]">
                        {entry.totalPoints.toLocaleString()}
                      </span>

                      {/* Events */}
                      <span className="hidden text-right text-xs text-[var(--muted-foreground)] md:block">
                        {entry.eventsJoined}
                      </span>

                      {/* Wins */}
                      <span className="hidden text-right text-xs text-[var(--muted-foreground)] md:block">
                        {entry.wins}
                      </span>

                      {/* Attendance % */}
                      <span className="hidden text-right text-xs text-[var(--muted-foreground)] md:block">
                        {entry.attendancePct}%
                      </span>

                      {/* Rank Change */}
                      <div className="hidden justify-center md:flex">
                        <RankChangeIndicator change={entry.rankChange} />
                      </div>

                      {/* Badges */}
                      <div className="hidden items-center gap-1 md:flex">
                        {entry.badgeList.slice(0, 2).map((b, i) => (
                          <span
                            key={i}
                            title={`${b.name} (${b.tier})`}
                            className="text-base leading-none"
                          >
                            {b.icon}
                          </span>
                        ))}
                        {entry.badges > 2 && (
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            +{entry.badges - 2}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── Pagination ───────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted-foreground)]">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total} players
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                        page === p
                          ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Bottom Grid: Stats + Charts + Milestones + Achievements + HoF ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left col: Stats + Rank Progress */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leaderboard Statistics */}
          {loadingStats ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <Sk className="mb-4 h-5 w-40" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-[var(--muted)]/40 p-3">
                    <Sk className="mb-2 h-3 w-16" />
                    <Sk className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : lbStats ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Leaderboard Statistics
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Total Participants",
                    value: lbStats.totalParticipants.toLocaleString(),
                    icon: <Users className="h-4 w-4" />,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                  },
                  {
                    label: "Avg Points",
                    value: lbStats.averagePoints.toLocaleString(),
                    icon: <Star className="h-4 w-4" />,
                    color: "text-violet-500",
                    bg: "bg-violet-500/10",
                  },
                  {
                    label: "Highest Points",
                    value: lbStats.highestPoints.toLocaleString(),
                    icon: <Zap className="h-4 w-4" />,
                    color: "text-yellow-500",
                    bg: "bg-yellow-500/10",
                  },
                  {
                    label: "Festival Leader",
                    value: lbStats.festivalLeader ?? "—",
                    icon: <Crown className="h-4 w-4" />,
                    color: "text-amber-500",
                    bg: "bg-amber-500/10",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3"
                  >
                    <div className={`mb-1.5 inline-flex rounded-lg p-1 ${s.bg} ${s.color}`}>
                      {s.icon}
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)]">{s.label}</p>
                    <p className={`mt-0.5 text-base font-black ${s.color} truncate`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {/* Rank Progress Chart */}
          {myStats && myStats.pointsHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Rank Progress
                </h2>
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                  Last 8 weeks
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Points over time */}
                <div>
                  <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
                    Points Earned
                  </p>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={myStats.pointsHistory}>
                      <defs>
                        <linearGradient id="pointsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="points"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#pointsGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Rank movement */}
                <div>
                  <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
                    Rank Movement
                  </p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={myStats.pointsHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        reversed
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(v: number) => [`#${v}`, "Rank"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="rank"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rank Milestones */}
          {myStats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-500" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Rank Milestones
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    Progress to Rank #{myStats.milestone.nextRankPosition}
                  </span>
                  <span className="font-bold text-[var(--foreground)]">
                    {myStats.milestone.currentPoints.toLocaleString()} /{" "}
                    {myStats.milestone.nextRankPoints.toLocaleString()} pts
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${myStats.milestone.progressPct}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>{myStats.milestone.progressPct}% complete</span>
                  {myStats.milestone.pointsNeeded > 0 ? (
                    <span>
                      <span className="font-semibold text-violet-400">
                        {myStats.milestone.pointsNeeded.toLocaleString()} pts
                      </span>{" "}
                      needed to reach #{myStats.milestone.nextRankPosition}
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-400">
                      🎉 You&apos;ve reached this milestone!
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right col: Achievements + Hall of Fame */}
        <div className="space-y-6">
          {/* Achievements Preview */}
          {loadingSidebar ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <Sk className="mb-4 h-5 w-36" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-[var(--muted)]/40 p-3 text-center">
                    <Sk className="mx-auto mb-1 h-8 w-8 rounded-full" />
                    <Sk className="mx-auto h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ) : achievements ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Achievements
                </h2>
              </div>

              {/* Rank milestones grid */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {achievements.milestones.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-2.5 text-center transition-all ${
                      m.unlocked
                        ? "border-yellow-500/30 bg-yellow-500/10" :"border-[var(--border)] bg-[var(--muted)]/30 opacity-50 grayscale"
                    }`}
                  >
                    <div className="text-2xl">{m.icon}</div>
                    <p className="mt-1 text-[10px] font-semibold text-[var(--foreground)]">
                      {m.label}
                    </p>
                    {m.unlocked && (
                      <p className="text-[9px] text-emerald-500">✓ Unlocked</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Recent achievements */}
              {achievements.unlocked.length > 0 && (
                <>
                  <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
                    Recent Achievements
                  </p>
                  <div className="space-y-2">
                    {achievements.unlocked.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2"
                      >
                        <span className="text-xl">{a.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                            {a.name}
                          </p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            {a.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : null}

          {/* Hall of Fame Preview */}
          {loadingSidebar ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <Sk className="mb-4 h-5 w-36" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-2 flex items-center gap-3">
                  <Sk className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Sk className="h-3 w-24" />
                    <Sk className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : hofEntries && hofEntries.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Hall of Fame
                </h2>
              </div>
              <div className="space-y-3">
                {hofEntries.map((entry) => (
                  <div
                    key={entry.userId}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2.5"
                  >
                    <AvatarInitials
                      name={entry.username}
                      avatarUrl={entry.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[var(--foreground)]">
                        {entry.username}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        {entry.roleLabel}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-violet-400">
                      {entry.totalPoints.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/hall-of-fame"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 py-2 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                View Hall of Fame
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ) : null}

          {/* Weekly Progress Card */}
          {myStats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-violet-500/10 via-[var(--card)] to-[var(--card)] p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  Weekly Progress
                </h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Points this week</span>
                  <span className="font-bold text-violet-400">
                    +{myStats.weeklyPoints.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Points this month</span>
                  <span className="font-bold text-cyan-400">
                    +{myStats.monthlyPoints.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Current rank</span>
                  <span className="font-bold text-yellow-400">#{myStats.rank}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">Top percentage</span>
                  <span className="font-bold text-emerald-400">
                    Top {myStats.topPercentage}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

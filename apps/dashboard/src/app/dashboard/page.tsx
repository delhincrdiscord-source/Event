"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Star, Gamepad2, Medal, TrendingUp, Flame, Calendar, Clock, MapPin, Bell, ChevronRight, Zap, Gift, User, ArrowUpRight, CheckCircle2, AlertCircle, Award, Target, Activity,  } from "lucide-react";
import { getParticipantDashboard, getLeaderboard } from "./_actions/gamification";
import { getCurrentUser } from "./_actions/user";

// ─── Animation Variants ───────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--muted)] ${className}`}
    />
  );
}

function SkeletonStatCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <Skeleton className="h-4 w-20 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ─── Notification Icon Map ────────────────────────────────────────────────────
function notifIcon(type: string) {
  const map: Record<string, { icon: React.ReactNode; color: string }> = {
    REGISTRATION_APPROVED: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-500" },
    EVENT_REMINDER: { icon: <Bell className="h-4 w-4" />, color: "text-blue-500" },
    BADGE_UNLOCKED: { icon: <Award className="h-4 w-4" />, color: "text-yellow-500" },
    POINTS_AWARDED: { icon: <Star className="h-4 w-4" />, color: "text-purple-500" },
    REWARD_AVAILABLE: { icon: <Gift className="h-4 w-4" />, color: "text-pink-500" },
  };
  return map[type] ?? { icon: <Bell className="h-4 w-4" />, color: "text-[var(--muted-foreground)]" };
}

// ─── Activity Icon Map ────────────────────────────────────────────────────────
function activityConfig(type: string): { icon: React.ReactNode; color: string; label: string } {
  const map: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    REGISTRATION: { icon: <Calendar className="h-3.5 w-3.5" />, color: "bg-blue-500/20 text-blue-400", label: "Registered for Event" },
    ATTENDANCE: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-emerald-500/20 text-emerald-400", label: "Attended Event" },
    WIN: { icon: <Trophy className="h-3.5 w-3.5" />, color: "bg-yellow-500/20 text-yellow-400", label: "Won Tournament" },
    BADGE: { icon: <Award className="h-3.5 w-3.5" />, color: "bg-purple-500/20 text-purple-400", label: "Earned Badge" },
    REWARD: { icon: <Gift className="h-3.5 w-3.5" />, color: "bg-pink-500/20 text-pink-400", label: "Claimed Reward" },
  };
  return map[type] ?? { icon: <Activity className="h-3.5 w-3.5" />, color: "bg-[var(--muted)] text-[var(--muted-foreground)]", label: type };
}

// ─── Countdown Block ──────────────────────────────────────────────────────────
function CountdownBlock({ targetDate }: { targetDate: Date }) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);
  const units = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];
  return (
    <div className="flex items-center gap-2">
      {units.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center rounded-lg bg-[var(--muted)]/60 px-2.5 py-1.5 min-w-[44px]"
        >
          <span className="text-lg font-bold tabular-nums text-[var(--foreground)] leading-none">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Avatar Initials ──────────────────────────────────────────────────────────
function AvatarInitials({ name, size = "md", avatarUrl }: { name: string; size?: "sm" | "md" | "lg"; avatarUrl?: string | null }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizeClass = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-xl" }[size];
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-[var(--border)]`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 font-bold text-white ring-2 ring-[var(--border)]`}
    >
      {initials}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: "Open", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    LIVE: { label: "Live", className: "bg-red-500/15 text-red-500 border-red-500/30 animate-pulse" },
    DRAFT: { label: "Draft", className: "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type DashboardData = Awaited<ReturnType<typeof getParticipantDashboard>>["data"];
type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  eventsJoined: number;
  wins: number;
  badges: number;
};

// ─── Mock activity timeline (since no dedicated endpoint exists yet) ───────────
const MOCK_ACTIVITIES = [
  { id: "1", type: "REGISTRATION", label: "Registered for Valorant Customs Night", time: new Date(Date.now() - 2 * 3600000) },
  { id: "2", type: "BADGE", label: "Earned \'Early Bird\' Badge", time: new Date(Date.now() - 6 * 3600000) },
  { id: "3", type: "ATTENDANCE", label: "Attended CS2 Open Qualifier", time: new Date(Date.now() - 24 * 3600000) },
  { id: "4", type: "WIN", label: "Won BGMI Solo Tournament", time: new Date(Date.now() - 2 * 86400000) },
  { id: "5", type: "REWARD", label: "Claimed \'GameVerse T-Shirt\' Reward", time: new Date(Date.now() - 3 * 86400000) },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParticipantDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<{ username: string; avatarUrl: string | null } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashRes, userRes, lbRes] = await Promise.all([
        getParticipantDashboard(),
        getCurrentUser(),
        getLeaderboard(),
      ]);
      if (dashRes.success && dashRes.data) setData(dashRes.data);
      if (userRes.success && userRes.data) setUser({ username: userRes.data.username, avatarUrl: null });
      if (lbRes.success && lbRes.data) setLeaderboard(lbRes.data.slice(0, 5));
      if (!dashRes.success) {
        if (dashRes.code === "UNAUTHORIZED") { window.location.href = "/login"; return; }
        setError(dashRes.error ?? "Failed to load dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        {/* Header skeleton */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        {/* Progress skeleton */}
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
        {/* Event skeleton */}
        <Skeleton className="h-64" />
        {/* Events grid skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
        <p className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">{error}</p>
        <button
          onClick={load}
          className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    );
  }

  const d = data!;
  const username = user?.username ?? "Player";

  // Festival day calculation (approximate from progress)
  const totalFestivalDays = d.daysRemaining + Math.round((d.festivalProgress / 100) * (d.daysRemaining + Math.round((d.festivalProgress / 100) * 30)));
  const completedDays = Math.round((d.festivalProgress / 100) * 30);
  const festivalTotalDays = completedDays + d.daysRemaining;
  const currentStreak = 6; // placeholder — no streak endpoint yet
  const pointsForNextRank = Math.max(0, 1000 - (d.totalPoints % 1000));
  const nextRankProgress = ((d.totalPoints % 1000) / 1000) * 100;

  // Today's event: first upcoming event starting today
  const today = new Date();
  const todayEvent = d.upcomingEvents.find((ev) => {
    const evDate = new Date(ev.startDate);
    return (
      evDate.getFullYear() === today.getFullYear() &&
      evDate.getMonth() === today.getMonth() &&
      evDate.getDate() === today.getDate()
    );
  }) ?? null;

  const upcomingEvents = d.upcomingEvents.filter((ev) => ev !== todayEvent).slice(0, 3);

  // Current user in leaderboard
  const currentUserLbEntry = leaderboard.find((e) => e.username === username);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">

      {/* ── 1. HEADER ─────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          {/* Decorative gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/8 via-transparent to-indigo-500/8" />
          <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <AvatarInitials name={username} size="lg" avatarUrl={user?.avatarUrl} />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[var(--card)]">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  {getGreeting()} 👋
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  {username}
                </h1>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  Welcome back to <span className="font-semibold text-[var(--foreground)]">GameVerse Festival 2026</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-500">
                    <Zap className="h-3 w-3" /> Season 1
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                    <Calendar className="h-3 w-3" />
                    Day {completedDays} of {festivalTotalDays}
                  </span>
                </div>
              </div>
            </div>

            {/* Rank badge */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 text-center">
              <Trophy className="h-5 w-5 text-yellow-500 mb-1" />
              <span className="text-2xl font-black text-yellow-500">#{d.rank}</span>
              <span className="text-xs text-[var(--muted-foreground)]">Festival Rank</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. QUICK STATS ────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Festival Rank"
            value={`#${d.rank}`}
            sub={
              <span className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="h-3 w-3" /> +3 This Week
              </span>
            }
            gradient="from-yellow-500/20 to-amber-500/10"
            iconColor="text-yellow-500"
            borderColor="border-l-yellow-500"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Total Points"
            value={`${d.totalPoints.toLocaleString()}`}
            sub={<span className="text-emerald-500">+100 Today</span>}
            gradient="from-blue-500/20 to-cyan-500/10"
            iconColor="text-blue-500"
            borderColor="border-l-blue-500"
          />
          <StatCard
            icon={<Gamepad2 className="h-5 w-5" />}
            label="Events Joined"
            value={`${d.eventsJoined}`}
            sub={<span className="text-[var(--muted-foreground)]">Events</span>}
            gradient="from-emerald-500/20 to-green-500/10"
            iconColor="text-emerald-500"
            borderColor="border-l-emerald-500"
          />
          <StatCard
            icon={<Medal className="h-5 w-5" />}
            label="Total Wins"
            value={`${d.wins}`}
            sub={<span className="text-[var(--muted-foreground)]">Victories</span>}
            gradient="from-purple-500/20 to-violet-500/10"
            iconColor="text-purple-500"
            borderColor="border-l-purple-500"
          />
        </div>
      </motion.div>

      {/* ── 3. FESTIVAL PROGRESS ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Festival Progress */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">Festival Progress</span>
                </div>
                <span className="text-sm font-bold text-blue-500">{Math.round(d.festivalProgress)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(d.festivalProgress, 100)}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">{completedDays} / {festivalTotalDays} Days</span>
                <span>{d.daysRemaining} days remaining</span>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-[var(--foreground)]">Current Streak</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-orange-500">{currentStreak}</span>
                <span className="mb-1 text-lg font-semibold text-[var(--muted-foreground)]">Days 🔥</span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">Keep it up! Log in daily to maintain your streak.</p>
            </div>
          </div>

          {/* Next Rank Progress */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">Next Rank</span>
                </div>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">#{d.rank - 1}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${nextRankProgress}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">{d.totalPoints} pts</span>
                <span className="font-semibold text-purple-500">{pointsForNextRank} pts needed</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4. TODAY'S EVENT ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[var(--foreground)]">Today&apos;s Event</h2>
        </div>
        {todayEvent ? (
          <TodayEventCard event={todayEvent} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-14 text-center">
            <Gamepad2 className="h-10 w-10 text-[var(--muted-foreground)] mb-3 opacity-40" />
            <p className="font-semibold text-[var(--foreground)]">No events today</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Check back tomorrow or browse upcoming events below.</p>
            <Link
              href="/dashboard/events"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              Browse Events <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── 5. UPCOMING EVENTS ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[var(--foreground)]">Upcoming Events</h2>
          <Link href="/dashboard/events" className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-10 text-center">
            <Calendar className="h-8 w-8 text-[var(--muted-foreground)] mb-2 opacity-40" />
            <p className="text-sm text-[var(--muted-foreground)]">No upcoming events at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvents.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <UpcomingEventCard event={ev} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── 6. LEADERBOARD PREVIEW + NOTIFICATIONS ────────────────────────── */}
      <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-2">
        {/* Leaderboard */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <h2 className="text-sm font-bold text-[var(--foreground)]">Leaderboard</h2>
            </div>
            <Link href="/dashboard/leaderboard" className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
              Full Board <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">No leaderboard data yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => {
                const isCurrentUser = entry.username === username;
                const rankEmoji = ["🥇", "🥈", "🥉"][i] ?? null;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      isCurrentUser
                        ? "bg-violet-500/15 border border-violet-500/30"
                        : "hover:bg-[var(--muted)]/50"
                    }`}
                  >
                    <span className="w-6 text-center text-sm font-bold text-[var(--muted-foreground)]">
                      {rankEmoji ?? `#${entry.rank}`}
                    </span>
                    <AvatarInitials name={entry.username} size="sm" avatarUrl={entry.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-semibold ${isCurrentUser ? "text-violet-400" : "text-[var(--foreground)]"}`}>
                        {entry.username}
                        {isCurrentUser && <span className="ml-1.5 text-[10px] font-normal text-violet-400">(You)</span>}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[var(--foreground)]">
                      {entry.totalPoints.toLocaleString()} <span className="text-xs font-normal text-[var(--muted-foreground)]">pts</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-bold text-[var(--foreground)]">Recent Notifications</h2>
            </div>
            <Link href="/dashboard/notifications" className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {d.recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-[var(--muted-foreground)] mb-2 opacity-30" />
              <p className="text-sm text-[var(--muted-foreground)]">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {d.recentNotifications.map((n) => {
                const { icon, color } = notifIcon(n.type);
                return (
                  <div key={n.id} className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-[var(--muted)]/50 transition-colors">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] ${color}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] leading-snug">{n.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── 7. ACTIVITY TIMELINE + QUICK ACTIONS ─────────────────────────── */}
      <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-2">
        {/* Activity Timeline */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">Recent Activity</h2>
          </div>
          <div className="relative space-y-0">
            {MOCK_ACTIVITIES.map((act, i) => {
              const cfg = activityConfig(act.type);
              return (
                <div key={act.id} className="flex gap-3 pb-4 last:pb-0">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    {i < MOCK_ACTIVITIES.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-[var(--border)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-[var(--foreground)] leading-snug">{act.label}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{timeAgo(act.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-yellow-500" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/dashboard/events", icon: <Calendar className="h-5 w-5" />, label: "Register for Event", color: "from-blue-500/20 to-blue-500/5 hover:from-blue-500/30 border-blue-500/20", iconColor: "text-blue-500" },
              { href: "/dashboard/events", icon: <Gamepad2 className="h-5 w-5" />, label: "View Events", color: "from-emerald-500/20 to-emerald-500/5 hover:from-emerald-500/30 border-emerald-500/20", iconColor: "text-emerald-500" },
              { href: "/dashboard/leaderboard", icon: <Trophy className="h-5 w-5" />, label: "View Leaderboard", color: "from-yellow-500/20 to-yellow-500/5 hover:from-yellow-500/30 border-yellow-500/20", iconColor: "text-yellow-500" },
              { href: "/dashboard/rewards", icon: <Gift className="h-5 w-5" />, label: "Claim Rewards", color: "from-pink-500/20 to-pink-500/5 hover:from-pink-500/30 border-pink-500/20", iconColor: "text-pink-500" },
              { href: "/dashboard/settings/profile", icon: <User className="h-5 w-5" />, label: "Edit Profile", color: "from-purple-500/20 to-purple-500/5 hover:from-purple-500/30 border-purple-500/20", iconColor: "text-purple-500" },
              { href: "/dashboard/achievements", icon: <Award className="h-5 w-5" />, label: "Achievements", color: "from-orange-500/20 to-orange-500/5 hover:from-orange-500/30 border-orange-500/20", iconColor: "text-orange-500" },
            ].map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={`group flex flex-col items-center justify-center gap-2 rounded-xl border bg-gradient-to-br p-4 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
              >
                <span className={`${action.iconColor} transition-transform group-hover:scale-110`}>{action.icon}</span>
                <span className="text-xs font-semibold text-[var(--foreground)] leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  gradient,
  iconColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
  gradient: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 border-l-4 ${borderColor} hover:shadow-lg transition-shadow duration-200`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className={`${iconColor}`}>{icon}</span>
          <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-2xl font-black tracking-tight text-[var(--foreground)]">{value}</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
        <div className="mt-1.5 text-xs font-medium">{sub}</div>
      </div>
    </div>
  );
}

// ─── Today Event Card ─────────────────────────────────────────────────────────
function TodayEventCard({
  event,
}: {
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    bannerUrl: string | null;
    location: string | null;
    category: string | null;
    status: string;
  };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      {/* Banner */}
      <div className="relative h-40 sm:h-52 bg-gradient-to-br from-violet-600/40 via-indigo-600/30 to-blue-600/20 flex items-center justify-center overflow-hidden">
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Gamepad2 className="h-16 w-16 text-white/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <StatusBadge status={event.status} />
          {event.category && (
            <span className="rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-white">
              {event.category}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[var(--foreground)] leading-tight">{event.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.startDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(event.startDate)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Starts in</p>
              <CountdownBlock targetDate={new Date(event.startDate)} />
            </div>
          </div>
          <div className="flex gap-2 sm:flex-col sm:items-end">
            <Link
              href={`/dashboard/events`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Zap className="h-4 w-4" /> Join Now
            </Link>
            <Link
              href={`/dashboard/events`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming Event Card ──────────────────────────────────────────────────────
function UpcomingEventCard({
  event,
}: {
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    bannerUrl: string | null;
    location: string | null;
    category: string | null;
    status: string;
  };
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50 hover:shadow-lg transition-all duration-200">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 flex items-center justify-center overflow-hidden">
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.title} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Gamepad2 className="h-10 w-10 text-white/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />
        <div className="absolute top-2 left-2">
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {event.category && (
          <span className="inline-block rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)] mb-2">
            {event.category}
          </span>
        )}
        <h3 className="font-bold text-[var(--foreground)] text-sm leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
          {event.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(event.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(event.startDate)}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            href="/dashboard/events"
            className="flex-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-center text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Register
          </Link>
          <Link
            href="/dashboard/events"
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-center text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
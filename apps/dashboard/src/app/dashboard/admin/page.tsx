"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Ticket, CalendarDays, Calendar, Clock, CheckCircle2, Star, Wifi, Plus, CalendarPlus, ClipboardList, Megaphone, Trophy, Settings, Activity, AlertCircle, Zap, BarChart3, Bell, MessageCircle, RefreshCw, ChevronRight, Radio, UserCheck, TrendingUp, Shield,  } from "lucide-react";
import {
  getDashboardStats,
  getFestivalOverview,
  getLiveEvents,
  getUpcomingEvents,
  getRecentActivity,
  getPendingTasks,
  getDiscordStatus,
  getSystemHealth,
  getAdminNotifications,
  type DashboardStats,
  type FestivalOverview,
  type LiveEvent,
  type UpcomingEvent,
  type ActivityItem,
  type PendingTask,
  type DiscordStatus,
  type SystemHealth,
  type AdminNotification,
} from "./_actions/dashboard";
import { getCurrentUser } from "../_actions/user";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatCountdown(endDate: Date): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[var(--muted)] ${className ?? ""}`} />;
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  loading?: boolean;
}

function StatCard({ icon: Icon, label, value, color, bgColor, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-4 w-28" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Health Indicator ───────────────────────────────────────────────────────

function HealthDot({ status }: { status: "healthy" | "degraded" | "down" }) {
  const colors = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    down: "bg-red-500",
  };
  const labels = { healthy: "Healthy", degraded: "Degraded", down: "Down" };
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${colors[status]} ring-2 ring-offset-1 ring-offset-[var(--card)] ${colors[status].replace("bg-", "ring-")}`} />
      <span className={`text-sm font-medium ${status === "healthy" ? "text-green-500" : status === "degraded" ? "text-yellow-500" : "text-red-500"}`}>
        {labels[status]}
      </span>
    </div>
  );
}

// ─── Activity Icon ───────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const map: Record<ActivityItem["type"], { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    REGISTRATION: { icon: Ticket, color: "text-blue-500", bg: "bg-blue-500/10" },
    PARTICIPANT: { icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    ATTENDANCE: { icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
    LEADERBOARD: { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    ANNOUNCEMENT: { icon: Megaphone, color: "text-orange-500", bg: "bg-orange-500/10" },
    EVENT_COMPLETED: { icon: CheckCircle2, color: "text-teal-500", bg: "bg-teal-500/10" },
  };
  const { icon: Icon, color, bg } = map[type];
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
  );
}

// ─── Quick Nav Items ─────────────────────────────────────────────────────────

const quickNavItems = [
  { label: "Festivals", href: "/dashboard/admin/festivals", icon: Calendar, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { label: "Events", href: "/dashboard/admin/events", icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Registrations", href: "/dashboard/admin/registrations", icon: Ticket, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Participants", href: "/dashboard/admin/registrations", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
  { label: "Attendance", href: "/dashboard/admin/registrations", icon: UserCheck, color: "text-teal-500", bg: "bg-teal-500/10" },
  { label: "Points", href: "/dashboard/admin/analytics", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Leaderboard", href: "/dashboard/hall-of-fame", icon: Trophy, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Announcements", href: "/dashboard/admin/announcements", icon: Megaphone, color: "text-red-500", bg: "bg-red-500/10" },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "text-slate-500", bg: "bg-slate-500/10" },
];

const quickActions = [
  { label: "Create Festival", href: "/dashboard/admin/festivals/new", icon: Plus, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { label: "Create Event", href: "/dashboard/admin/events/new", icon: CalendarPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Open Registrations", href: "/dashboard/admin/registrations", icon: ClipboardList, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Create Announcement", href: "/dashboard/admin/announcements/new", icon: Megaphone, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Publish Leaderboard", href: "/dashboard/hall-of-fame", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-600/10" },
  { label: "View Participants", href: "/dashboard/admin/registrations", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [festival, setFestival] = useState<FestivalOverview | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [adminNotifs, setAdminNotifs] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [
      userRes,
      statsRes,
      festivalRes,
      liveRes,
      upcomingRes,
      activityRes,
      tasksRes,
      discordRes,
      healthRes,
      notifsRes,
    ] = await Promise.all([
      getCurrentUser(),
      getDashboardStats(),
      getFestivalOverview(),
      getLiveEvents(),
      getUpcomingEvents(),
      getRecentActivity(),
      getPendingTasks(),
      getDiscordStatus(),
      getSystemHealth(),
      getAdminNotifications(),
    ]);

    if (userRes.success && userRes.data) setUsername(userRes.data.username);
    if (statsRes.success) setStats(statsRes.data);
    if (festivalRes.success) setFestival(festivalRes.data);
    if (liveRes.success) setLiveEvents(liveRes.data);
    if (upcomingRes.success) setUpcomingEvents(upcomingRes.data);
    if (activityRes.success) setActivity(activityRes.data);
    if (tasksRes.success) setPendingTasks(tasksRes.data);
    if (discordRes.success) setDiscordStatus(discordRes.data);
    if (healthRes.success) setSystemHealth(healthRes.data);
    if (notifsRes.success) setAdminNotifs(notifsRes.data);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [loadData]);

  const festivalProgress = festival
    ? Math.round((festival.currentDay / festival.totalDays) * 100)
    : 0;
  const eventProgress = festival && festival.totalEvents > 0
    ? Math.round((festival.completedEvents / festival.totalEvents) * 100)
    : 0;
  const regProgress = festival && stats
    ? Math.min(100, Math.round((stats.totalRegistrations / Math.max(1, festival.totalRegistrations || stats.totalRegistrations)) * 100))
    : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-6 w-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
              📊 Dashboard
            </h1>
          </div>
          <p className="text-[var(--muted-foreground)]">
            Welcome back,{" "}
            <span className="font-semibold text-[var(--foreground)]">{username || "Admin"}</span>
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            {festival ? (
              <>
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                  {festival.name}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  festival.status === "LIVE" ? "bg-green-500/10 text-green-500" :
                  festival.status === "UPCOMING" ? "bg-blue-500/10 text-blue-500" :
                  festival.status === "COMPLETED"? "bg-slate-500/10 text-slate-500" : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {festival.status}
                </span>
              </>
            ) : (
              <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                No Active Festival
              </span>
            )}
          </div>
          {festival && (
            <p className="text-sm text-[var(--muted-foreground)]">
              Day {festival.currentDay} of {festival.totalDays}
            </p>
          )}
          <p className="text-xs text-[var(--muted-foreground)]">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}{" "}
            · {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </motion.div>

      {/* ── Quick Stats ── */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Quick Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Participants" value={stats?.totalParticipants ?? 0} color="text-blue-500" bgColor="bg-blue-500/10" loading={loading} />
          <StatCard icon={Ticket} label="Total Registrations" value={stats?.totalRegistrations ?? 0} color="text-green-500" bgColor="bg-green-500/10" loading={loading} />
          <StatCard icon={Radio} label="Active Events" value={stats?.activeEvents ?? 0} color="text-purple-500" bgColor="bg-purple-500/10" loading={loading} />
          <StatCard icon={CalendarDays} label="Today's Events" value={stats?.todayEvents ?? 0} color="text-orange-500" bgColor="bg-orange-500/10" loading={loading} />
          <StatCard icon={Clock} label="Pending Registrations" value={stats?.pendingRegistrations ?? 0} color="text-yellow-500" bgColor="bg-yellow-500/10" loading={loading} />
          <StatCard icon={CheckCircle2} label="Events Completed" value={stats?.completedEvents ?? 0} color="text-teal-500" bgColor="bg-teal-500/10" loading={loading} />
          <StatCard icon={Star} label="Total Points Awarded" value={stats?.totalPointsAwarded ?? 0} color="text-amber-500" bgColor="bg-amber-500/10" loading={loading} />
          <StatCard icon={Wifi} label="Online Participants" value={stats?.onlineParticipants ?? 0} color="text-cyan-500" bgColor="bg-cyan-500/10" loading={loading} />
        </div>
      </motion.div>

      {/* ── Festival Overview + Quick Actions ── */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        {/* Festival Overview */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <Calendar className="h-4 w-4 text-[var(--primary)]" />
            Festival Overview
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : festival ? (
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Festival Progress</span>
                  <span className="font-semibold text-[var(--foreground)]">{festivalProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                    style={{ width: `${festivalProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Day {festival.currentDay} of {festival.totalDays} · {formatDate(festival.startDate)} → {formatDate(festival.endDate)}
                </p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Events Progress</span>
                  <span className="font-semibold text-[var(--foreground)]">{eventProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-700"
                    style={{ width: `${eventProgress}%` }}
                  />
                </div>
                <div className="mt-1 flex gap-4 text-xs text-[var(--muted-foreground)]">
                  <span>Total: <strong className="text-[var(--foreground)]">{festival.totalEvents}</strong></span>
                  <span>Done: <strong className="text-teal-500">{festival.completedEvents}</strong></span>
                  <span>Left: <strong className="text-[var(--foreground)]">{festival.remainingEvents}</strong></span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Registration Progress</span>
                  <span className="font-semibold text-[var(--foreground)]">{regProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-700"
                    style={{ width: `${regProgress}%` }}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-[var(--muted)]/50 p-3">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">Festival Countdown</p>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {new Date(festival.endDate) > new Date() ? formatCountdown(festival.endDate) : "Festival Ended"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">until festival ends</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="mb-2 h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">No active festival</p>
              <Link
                href="/dashboard/admin/festivals/new"
                className="mt-3 rounded-md bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90"
              >
                Create Festival
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <Zap className="h-4 w-4 text-[var(--primary)]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className="group flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-center transition-all hover:border-[var(--primary)] hover:shadow-sm"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bg}`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Live Event Panel ── */}
      <motion.div variants={item}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          Live Events
        </h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : liveEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-xl border border-red-500/30 bg-[var(--card)] p-5 ring-1 ring-red-500/10"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Live</span>
                    </div>
                    <h3 className="font-semibold text-[var(--foreground)] line-clamp-1">{evt.title}</h3>
                  </div>
                  {evt.category && (
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                      {evt.category.emoji} {evt.category.name}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-sm text-[var(--muted-foreground)]">
                  {evt.host && (
                    <p className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Host: <span className="text-[var(--foreground)]">{evt.host}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {evt.participantCount} participants
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Ends in {formatCountdown(evt.endDate)}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/admin/events/${evt.id}`}
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-center text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/admin/events/${evt.id}/edit`}
                    className="flex-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-center text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <Radio className="mx-auto mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">No live events right now</p>
          </div>
        )}
      </motion.div>

      {/* ── Recent Activity + Pending Tasks ── */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <Activity className="h-4 w-4 text-[var(--primary)]" />
            Recent Activity
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <ActivityIcon type={act.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{act.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{act.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">No recent activity</p>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <AlertCircle className="h-4 w-4 text-[var(--primary)]" />
            Pending Tasks
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <Link
                  key={task.type}
                  href={task.href}
                  className="group flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 transition-colors hover:border-[var(--primary)]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${task.count > 0 ? "bg-yellow-500/10" : "bg-[var(--muted)]"}`}>
                      <ClipboardList className={`h-4 w-4 ${task.count > 0 ? "text-yellow-500" : "text-[var(--muted-foreground)]"}`} />
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">{task.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${task.count > 0 ? "bg-yellow-500/10 text-yellow-500" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                      {task.count}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Upcoming Events ── */}
      <motion.div variants={item}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
            Upcoming Events
          </h2>
          <Link
            href="/dashboard/admin/events"
            className="text-xs text-[var(--primary)] hover:underline"
          >
            View all
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                className="group rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="relative h-24 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center">
                  {evt.bannerUrl ? (
                    <img src={evt.bannerUrl} alt={evt.title} className="h-full w-full object-cover" />
                  ) : (
                    <CalendarDays className="h-8 w-8 text-[var(--primary)]/40" />
                  )}
                  <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    evt.status === "LIVE" ? "bg-red-500 text-white" :
                    evt.status === "PUBLISHED"? "bg-green-500 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}>
                    {evt.status}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1 mb-1">{evt.title}</h3>
                  {evt.category && (
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">
                      {evt.category.emoji} {evt.category.name}
                    </p>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(evt.startDate)} · {formatTime(evt.startDate)}
                  </p>
                  {evt.host && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Host: {evt.host}</p>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {evt.registeredCount} registered{evt.capacity ? ` / ${evt.capacity}` : ""}
                  </p>
                  <Link
                    href={`/dashboard/admin/events/${evt.id}`}
                    className="mt-2 block w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-center text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <CalendarDays className="mx-auto mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">No upcoming events</p>
            <Link
              href="/dashboard/admin/events/new"
              className="mt-3 inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90"
            >
              Create Event
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── Discord Status + System Health ── */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        {/* Discord Status */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <MessageCircle className="h-4 w-4 text-indigo-500" />
            Discord Status
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : discordStatus ? (
            <div className="space-y-3">
              {[
                {
                  label: "Bot Status",
                  value: (
                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${
                      discordStatus.botStatus === "ONLINE" ? "text-green-500" :
                      discordStatus.botStatus === "ERROR"? "text-red-500" : "text-yellow-500"
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${
                        discordStatus.botStatus === "ONLINE" ? "bg-green-500 animate-pulse" :
                        discordStatus.botStatus === "ERROR"? "bg-red-500" : "bg-yellow-500"
                      }`} />
                      {discordStatus.botStatus}
                    </span>
                  ),
                },
                { label: "Latency", value: discordStatus.latency != null ? `${discordStatus.latency}ms` : "—" },
                { label: "Connected Guild", value: discordStatus.guildName ?? discordStatus.guildId ?? "—" },
                { label: "Announcement Channel", value: discordStatus.announcementChannel ? `#${discordStatus.announcementChannel}` : "—" },
                { label: "Active Automations", value: discordStatus.activeAutomations },
                { label: "Webhook Failures (24h)", value: discordStatus.webhookFailures > 0 ? (
                  <span className="text-red-500 font-semibold">{discordStatus.webhookFailures}</span>
                ) : "0" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-[var(--muted)]/40 px-3 py-2">
                  <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
                </div>
              ))}
              <Link
                href="/dashboard/admin/discord"
                className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-indigo-500 hover:text-indigo-500"
              >
                <Settings className="h-3.5 w-3.5" />
                Configure Discord
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MessageCircle className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">Discord not configured</p>
              <Link
                href="/dashboard/admin/discord"
                className="mt-3 rounded-md bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
              >
                Setup Discord
              </Link>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <Activity className="h-4 w-4 text-green-500" />
            System Health
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : systemHealth ? (
            <div className="space-y-3">
              {(
                [
                  { label: "API", key: "api" },
                  { label: "Database", key: "database" },
                  { label: "Redis", key: "redis" },
                  { label: "Storage", key: "storage" },
                  { label: "Environment", key: "environment" },
                ] as { label: string; key: keyof SystemHealth }[]
              ).map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between rounded-lg bg-[var(--muted)]/40 px-3 py-2.5">
                  <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
                  <HealthDot status={systemHealth[key]} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">Unable to load health status</p>
          )}
        </div>
      </motion.div>

      {/* ── Admin Notifications + Quick Navigation ── */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        {/* Admin Notifications */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
              <Bell className="h-4 w-4 text-[var(--primary)]" />
              Admin Notifications
            </h2>
            <Link href="/dashboard/notifications" className="text-xs text-[var(--primary)] hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : adminNotifs.length > 0 ? (
            <div className="space-y-2">
              {adminNotifs.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${!notif.isRead ? "bg-[var(--primary)]/5" : "bg-[var(--muted)]/30"}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!notif.isRead ? "bg-[var(--primary)]/10" : "bg-[var(--muted)]"}`}>
                    <Bell className={`h-4 w-4 ${!notif.isRead ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!notif.isRead ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">No notifications</p>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
            Quick Navigation
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {quickNavItems.map((nav) => {
              const Icon = nav.icon;
              return (
                <Link
                  key={nav.href + nav.label}
                  href={nav.href}
                  className="group flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 transition-all hover:border-[var(--primary)] hover:shadow-sm"
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${nav.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${nav.color}`} />
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] truncate">
                    {nav.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

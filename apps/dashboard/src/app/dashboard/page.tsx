"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Star, Gamepad2, Crown, Bell, Calendar, ChevronRight, Loader2, Clock, MapPin } from "lucide-react";
import { getParticipantDashboard } from "./_actions/gamification";
import { getCurrentUser } from "./_actions/user";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="h-4 w-24 rounded bg-[var(--muted)]" />
      <div className="mt-3 h-8 w-16 rounded bg-[var(--muted)]" />
      <div className="mt-2 h-3 w-32 rounded bg-[var(--muted)]" />
    </div>
  );
}

export default function ParticipantDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getParticipantDashboard>>["data"] | null>(null);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getParticipantDashboard(),
      getCurrentUser(),
    ]).then(([dashRes, userRes]) => {
      if (dashRes.success && dashRes.data) setData(dashRes.data);
      if (userRes.success && userRes.data) setUsername(userRes.data.username);
      if (!dashRes.success) {
        if (dashRes.code === "UNAUTHORIZED") {
          window.location.href = "/login";
          return;
        }
        setError(dashRes.error ?? "Failed to load dashboard");
      }
    }).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-9 w-64 animate-pulse rounded bg-[var(--muted)]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl">😔</span>
        <p className="mt-4 text-lg font-medium text-[var(--foreground)]">Something went wrong</p>
        <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
      </div>
    );
  }

  const d = data!;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Welcome back, {username || "Player"}! 👋
        </h1>
        <p className="text-[var(--muted-foreground)]">Here&apos;s your festival overview</p>
      </motion.div>

      {/* Top Stats */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard emoji="🏆" label="Festival Rank" value={`#${d.rank}`} accent="border-l-yellow-500" />
        <StatCard emoji="⭐" label="Total Points" value={String(d.totalPoints)} accent="border-l-blue-500" />
        <StatCard emoji="🎮" label="Events Joined" value={String(d.eventsJoined)} accent="border-l-green-500" />
        <StatCard emoji="🥇" label="Wins" value={String(d.wins)} accent="border-l-purple-500" />
      </motion.div>

      {/* Progress */}
      <motion.div variants={item} className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">📅 Festival Progress</h3>
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--foreground)]">{Math.round(d.festivalProgress)}%</span>
              <span className="text-[var(--muted-foreground)]">{d.daysRemaining} days remaining</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--muted)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(d.festivalProgress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">⏰ Next Event</h3>
          {d.nextEvent ? (
            <div className="mt-3">
              <p className="font-semibold text-[var(--foreground)]">{d.nextEvent.title}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {new Date(d.nextEvent.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">No new events to join 🎉</p>
          )}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)]">🔔 Recent Notifications</h3>
        {d.recentNotifications.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">No notifications yet</p>
        ) : (
          <div className="mt-3 space-y-3">
            {d.recentNotifications.map((n) => (
              <div key={n.id} className="flex items-center gap-3">
                <span className="text-lg">🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{n.title}</p>
                </div>
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{timeAgo(n.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Upcoming Events */}
      <motion.div variants={item} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">📅 Upcoming Events</h3>
          <Link href="/dashboard/events" className="text-xs text-[var(--primary)] hover:underline">
            View all <ChevronRight className="inline h-3 w-3" />
          </Link>
        </div>
        {d.upcomingEvents.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">No upcoming events</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {d.upcomingEvents.map((ev) => (
              <Link
                key={ev.id}
                href={`/dashboard/events/${ev.id}`}
                className="group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] transition-colors hover:border-[var(--primary)]"
              >
                <div className="h-24 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center">
                  <span className="text-3xl opacity-60">🎮</span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">{ev.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ev.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.category && (
                    <span className="mt-2 inline-block rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs text-[var(--primary)]">
                      {ev.category}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatCard({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 border-l-4 ${accent}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Clock, Users, Filter, X, Zap, Trophy, Star, Shield, Gamepad2, Radio, CheckCircle2, XCircle, AlertCircle, SlidersHorizontal, ChevronDown, Flame, Award, Timer, Mic, MessageSquare,  } from "lucide-react";
import { Card } from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";
import {
  getParticipantEvents,
  getEventDetail,
  getFestivals,
  getEventCategories,
  type ParticipantEvent,
  type EventDetail,
} from "@/app/dashboard/_actions/events";

// ─── Animation Variants ───────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: Date | string, end: Date | string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function useCountdown(targetDate: Date | string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

// ─── Countdown Display ────────────────────────────────────────────────────────
function CountdownDisplay({ targetDate, compact = false }: { targetDate: Date | string; compact?: boolean }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(targetDate);
  if (expired) return <span className="text-xs text-[var(--muted-foreground)]">Started</span>;
  if (compact) {
    if (days > 0) return <span className="text-xs font-mono text-[var(--primary)]">{days}d {hours}h</span>;
    return <span className="text-xs font-mono text-orange-500">{String(hours).padStart(2,"0")}:{String(minutes).padStart(2,"0")}:{String(seconds).padStart(2,"0")}</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      {[{ v: days, l: "d" }, { v: hours, l: "h" }, { v: minutes, l: "m" }, { v: seconds, l: "s" }].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center rounded-md bg-[var(--muted)]/60 px-2 py-1 min-w-[36px]">
          <span className="text-sm font-bold tabular-nums leading-none text-[var(--foreground)]">{String(v).padStart(2, "0")}</span>
          <span className="text-[9px] text-[var(--muted-foreground)] mt-0.5">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Live Timer ───────────────────────────────────────────────────────────────
function LiveTimer({ startDate }: { startDate: Date | string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span className="font-mono text-xs text-red-400">
      {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
    </span>
  );
}

// ─── Difficulty Badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ category }: { category: string | null }) {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    "Tournament": { label: "Competitive", color: "text-red-500 bg-red-500/10", icon: "🔥" },
    "Casual": { label: "Casual", color: "text-green-500 bg-green-500/10", icon: "🎮" },
    "Workshop": { label: "Beginner", color: "text-blue-500 bg-blue-500/10", icon: "📚" },
    "Esports": { label: "Pro", color: "text-purple-500 bg-purple-500/10", icon: "⚡" },
  };
  const cfg = (category && map[category]) || { label: "Open", color: "text-[var(--muted-foreground)] bg-[var(--muted)]", icon: "🎯" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Registration Status Badge ────────────────────────────────────────────────
function RegStatusBadge({ event }: { event: ParticipantEvent }) {
  const now = new Date();
  const regEnd = event.registrationEnd ? new Date(event.registrationEnd) : null;
  const regStart = event.registrationStart ? new Date(event.registrationStart) : null;
  const isFull = event.capacity != null && event.currentParticipants >= event.capacity;

  if (event.isRegistered) return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/30"><CheckCircle2 className="h-3 w-3" /> Registered</span>;
  if (isFull) return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-500/30"><XCircle className="h-3 w-3" /> Full</span>;
  if (!event.registrationEnabled) return <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]"><AlertCircle className="h-3 w-3" /> Closed</span>;
  if (regEnd && regEnd < now) return <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-500 border border-orange-500/30"><AlertCircle className="h-3 w-3" /> Reg. Closed</span>;
  if (regStart && regStart > now) return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-500 border border-blue-500/30"><Clock className="h-3 w-3" /> Opens Soon</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/30"><CheckCircle2 className="h-3 w-3" /> Open</span>;
}

// ─── Can Register ─────────────────────────────────────────────────────────────
function canRegister(event: ParticipantEvent): boolean {
  if (event.isRegistered) return false;
  if (!event.registrationEnabled) return false;
  const now = new Date();
  if (event.registrationEnd && new Date(event.registrationEnd) < now) return false;
  if (event.registrationStart && new Date(event.registrationStart) > now) return false;
  if (event.capacity != null && event.currentParticipants >= event.capacity && !event.waitlistEnabled) return false;
  if (event.status === "COMPLETED" || event.status === "CANCELLED") return false;
  return true;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({
  event,
  onViewDetails,
  onRegister,
  onCancelRegistration,
}: {
  event: ParticipantEvent;
  onViewDetails: (id: string) => void;
  onRegister: (event: ParticipantEvent) => void;
  onCancelRegistration: (event: ParticipantEvent) => void;
}) {
  const isLive = event.status === "LIVE";
  const isCompleted = event.status === "COMPLETED";
  const isFull = event.capacity != null && event.currentParticipants >= event.capacity;
  const remainingSlots = event.capacity != null ? event.capacity - event.currentParticipants : null;
  const canReg = canRegister(event);

  return (
    <motion.div variants={fadeUp} className="group">
      <div
        className={`relative overflow-hidden rounded-2xl border bg-[var(--card)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5 ${
          isLive
            ? "border-red-500/40 shadow-sm shadow-red-500/10"
            : "border-[var(--border)] hover:border-[var(--primary)]/30"
        }`}
      >
        {/* Banner */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary)]/10 to-transparent">
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Gamepad2 className="h-12 w-12 text-[var(--primary)]/20" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* LIVE badge */}
          {isLive && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
          )}

          {/* Status badge top-right */}
          {!isLive && (
            <div className="absolute right-3 top-3">
              {isCompleted ? (
                <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  🏁 Completed
                </span>
              ) : (
                <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  🎮 Upcoming
                </span>
              )}
            </div>
          )}

          {/* Category bottom-left */}
          {event.category && (
            <div className="absolute bottom-3 left-3">
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                {event.categoryEmoji} {event.category}
              </span>
            </div>
          )}

          {/* Slots warning bottom-right */}
          {remainingSlots !== null && remainingSlots <= 5 && remainingSlots > 0 && (
            <div className="absolute bottom-3 right-3">
              <span className="rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                🔥 {remainingSlots} left
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors text-sm leading-snug flex-1">
              {event.title}
            </h3>
            <DifficultyBadge category={event.category} />
          </div>

          {/* Host / Festival */}
          {event.festivalName && (
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {event.festivalName}
            </p>
          )}

          {/* Date / Time / Duration */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(event.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {formatDuration(event.startDate, event.endDate)}
            </span>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <Users className="h-3 w-3" />
              <span>
                {event.currentParticipants}
                {event.capacity ? `/${event.capacity}` : ""} participants
              </span>
            </div>
            <RegStatusBadge event={event} />
          </div>

          {/* Slots bar */}
          {event.capacity != null && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-[var(--muted)]">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isFull ? "bg-red-500" : remainingSlots !== null && remainingSlots <= 5 ? "bg-orange-500" : "bg-[var(--primary)]"
                  }`}
                  style={{ width: `${Math.min(100, (event.currentParticipants / event.capacity) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Reward preview */}
          <div className="flex items-center gap-1 text-xs text-yellow-500">
            <Star className="h-3 w-3" />
            <span>Points Reward</span>
            <span className="text-[var(--muted-foreground)]">• Earn XP on completion</span>
          </div>

          {/* Countdown / Live timer */}
          {isLive ? (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
              <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              <span className="text-xs text-red-500 font-medium">Event in progress</span>
              <LiveTimer startDate={event.startDate} />
            </div>
          ) : !isCompleted ? (
            <div className="flex items-center gap-2">
              <Timer className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <CountdownDisplay targetDate={event.startDate} compact />
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onViewDetails(event.id)}
              className="flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 hover:text-[var(--primary)]"
            >
              View Details
            </button>

            {isLive && event.isRegistered ? (
              <button
                onClick={() => onViewDetails(event.id)}
                className="flex-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 flex items-center justify-center gap-1"
              >
                <Zap className="h-3 w-3" /> Join Event
              </button>
            ) : event.isRegistered ? (
              <button
                onClick={() => onCancelRegistration(event)}
                className="flex-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-500/20"
              >
                Cancel Reg.
              </button>
            ) : canReg ? (
              <button
                onClick={() => onRegister(event)}
                className="flex-1 rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" /> Register
              </button>
            ) : (
              <button
                disabled
                className="flex-1 cursor-not-allowed rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] opacity-60"
              >
                {isFull ? "Event Full" : "Reg. Closed"}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────
function EventDetailModal({
  eventId,
  onClose,
  onRegister,
  onCancelRegistration,
}: {
  eventId: string;
  onClose: () => void;
  onRegister: (event: EventDetail) => void;
  onCancelRegistration: (event: EventDetail) => void;
}) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "rewards" | "faq">("overview");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getEventDetail(eventId).then((res) => {
      if (res.success && res.data) setEvent(res.data);
      setIsLoading(false);
    });
  }, [eventId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isLive = event?.status === "LIVE";
  const isCompleted = event?.status === "COMPLETED";
  const canReg = event ? canRegister(event) : false;
  const isFull = event?.capacity != null && event.currentParticipants >= event.capacity;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>

          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : !event ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-4xl">⚠️</span>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">Event not found</p>
            </div>
          ) : (
            <>
              {/* Banner */}
              <div className="relative h-48 shrink-0 overflow-hidden bg-gradient-to-br from-[var(--primary)]/20 to-transparent">
                {event.bannerUrl ? (
                  <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Gamepad2 className="h-16 w-16 text-[var(--primary)]/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-black/20 to-transparent" />

                {isLive && (
                  <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    LIVE NOW
                  </div>
                )}

                {/* Title overlay */}
                <div className="absolute bottom-4 left-4 right-12">
                  <div className="flex items-center gap-2 mb-1">
                    {event.category && (
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        {event.categoryEmoji} {event.category}
                      </span>
                    )}
                    <DifficultyBadge category={event.category} />
                  </div>
                  <h2 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">{event.title}</h2>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Quick stats bar */}
                <div className="grid grid-cols-4 divide-x divide-[var(--border)] border-b border-[var(--border)]">
                  {[
                    { icon: <Calendar className="h-3.5 w-3.5" />, label: "Date", value: formatDate(event.startDate) },
                    { icon: <Clock className="h-3.5 w-3.5" />, label: "Time", value: formatTime(event.startDate) },
                    { icon: <Timer className="h-3.5 w-3.5" />, label: "Duration", value: formatDuration(event.startDate, event.endDate) },
                    { icon: <Users className="h-3.5 w-3.5" />, label: "Slots", value: event.capacity ? `${event.currentParticipants}/${event.capacity}` : `${event.currentParticipants}` },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5 py-3 px-2">
                      <span className="text-[var(--muted-foreground)]">{icon}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{label}</span>
                      <span className="text-xs font-semibold text-[var(--foreground)] text-center">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Live event actions */}
                {isLive && (
                  <div className="flex gap-2 p-4 border-b border-[var(--border)] bg-red-500/5">
                    <div className="flex items-center gap-2 flex-1">
                      <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                      <span className="text-sm font-medium text-red-500">Event is LIVE</span>
                      <LiveTimer startDate={event.startDate} />
                    </div>
                    <div className="flex gap-2">
                      {event.festival?.discordInvite && (
                        <a
                          href={event.festival.discordInvite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-[#5865F2] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Discord
                        </a>
                      )}
                      {event.discordVoiceChannelId && (
                        <button className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                          <Mic className="h-3.5 w-3.5" /> Voice
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Completed event results */}
                {isCompleted && (
                  <div className="p-4 border-b border-[var(--border)] bg-yellow-500/5">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" /> Event Results
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { place: "1st", emoji: "🥇", color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600" },
                        { place: "2nd", emoji: "🥈", color: "border-gray-400/30 bg-gray-400/10 text-gray-500" },
                        { place: "3rd", emoji: "🥉", color: "border-orange-500/30 bg-orange-500/10 text-orange-600" },
                      ].map(({ place, emoji, color }) => (
                        <div key={place} className={`rounded-xl border p-3 text-center ${color}`}>
                          <div className="text-2xl mb-1">{emoji}</div>
                          <div className="text-xs font-semibold">{place} Place</div>
                          <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">—</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      <span>Points awarded to participants</span>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-[var(--border)] px-4">
                  {(["overview", "schedule", "rewards", "faq"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-3 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                        activeTab === tab
                          ? "border-[var(--primary)] text-[var(--primary)]"
                          : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-4">
                  {activeTab === "overview" && (
                    <>
                      {/* Description */}
                      {event.fullDescription ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">About</h4>
                          <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{event.fullDescription}</p>
                        </div>
                      ) : event.shortDescription ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">About</h4>
                          <p className="text-sm text-[var(--foreground)] leading-relaxed">{event.shortDescription}</p>
                        </div>
                      ) : null}

                      {/* Host info */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Organizer</h4>
                        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)]/10">
                            <Shield className="h-4 w-4 text-[var(--primary)]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">{event.festivalName ?? "GameVerse"}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Host • Co-Host • Judges TBA</p>
                          </div>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Requirements</h4>
                        <ul className="space-y-1.5 text-sm text-[var(--foreground)]">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Valid GameVerse account</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Discord account linked</li>
                          {event.category === "Tournament" && (
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Game account required</li>
                          )}
                        </ul>
                      </div>

                      {/* Rules */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Rules</h4>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-sm text-[var(--muted-foreground)]">
                          Standard GameVerse event rules apply. Be respectful, follow fair play guidelines, and adhere to the event schedule. Detailed rules will be shared upon registration approval.
                        </div>
                      </div>

                      {/* Gallery placeholder */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Gallery</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="aspect-video rounded-lg bg-[var(--muted)] flex items-center justify-center">
                              <span className="text-xs text-[var(--muted-foreground)]">📷</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comments placeholder */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Comments</h4>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-center">
                          <MessageSquare className="h-6 w-6 text-[var(--muted-foreground)] mx-auto mb-2" />
                          <p className="text-xs text-[var(--muted-foreground)]">Comments will be available once you register</p>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "schedule" && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Event Schedule</h4>
                      {[
                        { time: formatTime(event.startDate), label: "Event Start", icon: "🚀" },
                        { time: "TBA", label: "Check-in Opens", icon: "🎟️" },
                        { time: "TBA", label: "Main Event", icon: "🎮" },
                        { time: formatTime(event.endDate), label: "Event End", icon: "🏁" },
                      ].map(({ time, label, icon }, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-16 text-right text-xs font-mono text-[var(--muted-foreground)] shrink-0">{time}</div>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm shrink-0">{icon}</div>
                          <span className="text-sm text-[var(--foreground)]">{label}</span>
                        </div>
                      ))}
                      {/* Countdown */}
                      {!isCompleted && !isLive && (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3">
                          <p className="text-xs text-[var(--muted-foreground)] mb-2">Starts in</p>
                          <CountdownDisplay targetDate={event.startDate} />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "rewards" && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Rewards & Prizes</h4>
                      {[
                        { place: "🥇 1st Place", reward: "Premium Reward + Max Points", color: "border-yellow-500/30 bg-yellow-500/5" },
                        { place: "🥈 2nd Place", reward: "Standard Reward + Points", color: "border-gray-400/30 bg-gray-400/5" },
                        { place: "🥉 3rd Place", reward: "Participation Reward + Points", color: "border-orange-500/30 bg-orange-500/5" },
                        { place: "🎮 All Participants", reward: "XP Points + Participation Badge", color: "border-[var(--border)] bg-[var(--muted)]/30" },
                      ].map(({ place, reward, color }) => (
                        <div key={place} className={`flex items-center justify-between rounded-xl border p-3 ${color}`}>
                          <span className="text-sm font-medium text-[var(--foreground)]">{place}</span>
                          <span className="text-xs text-[var(--muted-foreground)]">{reward}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "faq" && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Frequently Asked Questions</h4>
                      {[
                        { q: "How do I register?", a: "Click the Register button and complete the registration form. You'll receive a confirmation once approved." },
                        { q: "Can I cancel my registration?", a: "Yes, you can cancel your registration before the event starts from this page or My Registrations." },
                        { q: "What happens if the event is full?", a: event.waitlistEnabled ? "You can join the waitlist and will be notified if a spot opens up." : "Registration closes when capacity is reached. Check back for future events." },
                        { q: "How do I join the event?", a: "Once registered and approved, you'll receive Discord channel access and event details via notification." },
                      ].map(({ q, a }, i) => (
                        <div key={i} className="rounded-xl border border-[var(--border)] p-3">
                          <p className="text-sm font-medium text-[var(--foreground)] mb-1">{q}</p>
                          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{a}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="shrink-0 border-t border-[var(--border)] p-4 flex items-center gap-3 bg-[var(--card)]">
                <div className="flex-1">
                  <RegStatusBadge event={event} />
                  {!isCompleted && !isLive && (
                    <div className="mt-1">
                      <CountdownDisplay targetDate={event.startDate} compact />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {isLive && event.isRegistered ? (
                    <>
                      {event.festival?.discordInvite && (
                        <a
                          href={event.festival.discordInvite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                          <MessageSquare className="h-4 w-4" /> Discord
                        </a>
                      )}
                      <button className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                        <Zap className="h-4 w-4" /> Join Event
                      </button>
                    </>
                  ) : event.isRegistered ? (
                    <button
                      onClick={() => onCancelRegistration(event)}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      Cancel Registration
                    </button>
                  ) : canReg ? (
                    <button
                      onClick={() => onRegister(event)}
                      className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Register Now
                    </button>
                  ) : (
                    <button
                      disabled
                      className="cursor-not-allowed rounded-full bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] opacity-60"
                    >
                      {isFull ? "Event Full" : "Registration Closed"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
          value !== "" ?"border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]" :"border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--primary)]/30"
        }`}
      >
        {selected?.label ?? label}
        <ChevronDown className="h-3 w-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--accent)] ${
                  value === opt.value ? "text-[var(--primary)] font-medium" : "text-[var(--foreground)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = "upcoming" | "live" | "completed" | "registered";

export default function ParticipantEventsPage() {
  const [events, setEvents] = useState<ParticipantEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [festivalFilter, setFestivalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "participants">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Options
  const [festivals, setFestivals] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; emoji: string | null }[]>([]);

  // Modal
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load filter options
  useEffect(() => {
    getFestivals().then((r) => { if (r.success && r.data) setFestivals(r.data); });
    getEventCategories().then((r) => { if (r.success && r.data) setCategories(r.data); });
  }, []);

  // Load events
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getParticipantEvents({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        festivalId: festivalFilter || undefined,
        categoryId: categoryFilter || undefined,
        tab: activeTab,
        sortBy,
        sortDir,
      });
      if (!result.success) {
        if (result.code === "UNAUTHORIZED") { window.location.href = "/login"; return; }
        setError(result.error ?? "Failed to load events");
        return;
      }
      setEvents(result.data.events);
      setTotal(result.data.total);
    } catch {
      setError("Something went wrong loading events");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, festivalFilter, categoryFilter, activeTab, sortBy, sortDir]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, festivalFilter, categoryFilter, activeTab, sortBy, sortDir]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRegister = (event: ParticipantEvent | EventDetail) => {
    window.location.href = `/dashboard/my-registrations`;
    showNotification("success", `Redirecting to registration for ${event.title}`);
  };

  const handleCancelRegistration = (event: ParticipantEvent | EventDetail) => {
    window.location.href = `/dashboard/my-registrations`;
    showNotification("success", `Redirecting to manage registration for ${event.title}`);
  };

  const totalPages = Math.ceil(total / pageSize);
  const activeFiltersCount = [festivalFilter, categoryFilter].filter(Boolean).length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "upcoming", label: "Upcoming", icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: "live", label: "Live", icon: <Radio className="h-3.5 w-3.5" /> },
    { id: "completed", label: "Completed", icon: <Trophy className="h-3.5 w-3.5" /> },
    { id: "registered", label: "Registered", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed left-1/2 top-6 z-[60] flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg ${
              notification.type === "success" ?"border-emerald-500/30 bg-emerald-500/10 text-emerald-600" :"border-red-500/30 bg-red-500/10 text-red-600"
            }`}
          >
            {notification.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--primary)]/5 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--primary)/8,transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="h-5 w-5 text-[var(--primary)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">GameVerse Festival</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Events</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)] max-w-xl">
            Discover upcoming events, register, and participate in GameVerse Festival.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" /> {total} events available</span>
            <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-yellow-500" /> Earn points & rewards</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-[var(--primary)]" /> Verified events</span>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by event name, game, or host..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-10 text-sm outline-none transition-all focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle + sort */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--primary)]/30"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] font-bold text-[var(--primary-foreground)]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <FilterDropdown
              label="Sort"
              value={`${sortBy}-${sortDir}`}
              options={[
                { value: "date-asc", label: "Date ↑" },
                { value: "date-desc", label: "Date ↓" },
                { value: "title-asc", label: "Name A-Z" },
                { value: "title-desc", label: "Name Z-A" },
                { value: "participants-desc", label: "Most Popular" },
              ]}
              onChange={(v) => {
                const [by, dir] = v.split("-");
                setSortBy(by as "date" | "title" | "participants");
                setSortDir(dir as "asc" | "desc");
              }}
            />
          </div>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]">
                  <Filter className="h-3.5 w-3.5" /> Filters:
                </span>

                <FilterDropdown
                  label="Festival"
                  value={festivalFilter}
                  options={[
                    { value: "", label: "All Festivals" },
                    ...festivals.map((f) => ({ value: f.id, label: f.name })),
                  ]}
                  onChange={setFestivalFilter}
                />

                <FilterDropdown
                  label="Category"
                  value={categoryFilter}
                  options={[
                    { value: "", label: "All Categories" },
                    ...categories.map((c) => ({ value: c.id, label: `${c.emoji ?? ""} ${c.name}`.trim() })),
                  ]}
                  onChange={setCategoryFilter}
                />

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setFestivalFilter(""); setCategoryFilter(""); }}
                    className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.id === "live" && activeTab !== "live" && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{error}</p>
          <button
            onClick={loadEvents}
            className="mt-4 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      ) : events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-16 text-center"
        >
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <Gamepad2 className="h-10 w-10 text-[var(--primary)]/40" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--muted)]">
              <span className="text-sm">🎮</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">No events available</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
            {debouncedSearch || activeFiltersCount > 0
              ? "No events match your current filters. Try adjusting your search or filters."
              : activeTab === "registered" ?"You haven't registered for any events yet. Browse upcoming events to get started!"
              : activeTab === "live" ?"No events are live right now. Check back soon!" :"No events are available in this category right now. Check back soon!"}
          </p>
          {(debouncedSearch || activeFiltersCount > 0) && (
            <button
              onClick={() => { setSearch(""); setFestivalFilter(""); setCategoryFilter(""); setActiveTab("upcoming"); }}
              className="mt-4 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <motion.div
            key={`${activeTab}-${page}-${debouncedSearch}`}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={setSelectedEventId}
                onRegister={handleRegister}
                onCancelRegistration={handleCancelRegistration}
              />
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1">
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
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        page === p
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}

          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} events
          </p>
        </>
      )}

      {/* Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onRegister={(e) => { handleRegister(e); setSelectedEventId(null); }}
          onCancelRegistration={(e) => { handleCancelRegistration(e); setSelectedEventId(null); }}
        />
      )}
    </div>
  );
}

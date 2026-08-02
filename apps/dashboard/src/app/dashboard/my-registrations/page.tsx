"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Calendar, Clock, Trophy, Gamepad2, XCircle, AlertCircle, Timer, Bell, Download, Share2, CalendarPlus, Eye, ChevronLeft, ChevronRight, SlidersHorizontal, Ticket, Radio, MessageSquare, ClipboardList, UserCheck, ChevronDown, RefreshCw,  } from "lucide-react";
import { Card } from "@gameverse/ui/card";
import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";
import { getMyRegistrationsFull, getMyRegistrationSummary, cancelMyRegistration, getMyFestivals, getMyRegistrationNotifications, type MyRegistration, type RegistrationSummary, type RegistrationFilters, type RegistrationNotification,  } from "@/app/dashboard/_actions/registrations";

// ─── Animation Variants ───────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; dot: string }> = {
  PENDING:    { label: "Pending",    color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/30",   icon: "⏳", dot: "bg-amber-500" },
  APPROVED:   { label: "Approved",   color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", icon: "✅", dot: "bg-emerald-500" },
  WAITLISTED: { label: "Waitlisted", color: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/30",     icon: "📋", dot: "bg-blue-500" },
  REJECTED:   { label: "Rejected",   color: "text-red-500",     bg: "bg-red-500/10 border-red-500/30",       icon: "❌", dot: "bg-red-500" },
  COMPLETED:  { label: "Completed",  color: "text-purple-500",  bg: "bg-purple-500/10 border-purple-500/30", icon: "🏁", dot: "bg-purple-500" },
  CHECKED_IN: { label: "Checked In", color: "text-purple-500",  bg: "bg-purple-500/10 border-purple-500/30", icon: "🎟️", dot: "bg-purple-500" },
  CANCELLED:  { label: "Cancelled",  color: "text-[var(--muted-foreground)]", bg: "bg-[var(--muted)] border-[var(--border)]", icon: "🚫", dot: "bg-[var(--muted-foreground)]" },
};

const TABS = [
  { key: "ALL",       label: "All",        emoji: "📋" },
  { key: "UPCOMING",  label: "Upcoming",   emoji: "📅" },
  { key: "APPROVED",  label: "Approved",   emoji: "✅" },
  { key: "PENDING",   label: "Pending",    emoji: "⏳" },
  { key: "WAITLISTED",label: "Waitlisted", emoji: "📋" },
  { key: "REJECTED",  label: "Rejected",   emoji: "❌" },
  { key: "COMPLETED", label: "Completed",  emoji: "🏁" },
  { key: "CANCELLED", label: "Cancelled",  emoji: "🚫" },
];

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest First" },
  { value: "oldest",    label: "Oldest First" },
  { value: "upcoming",  label: "Upcoming Events" },
  { value: "completed", label: "Completed Events" },
];

const NOTIF_CONFIG: Record<string, { icon: string; color: string }> = {
  REGISTRATION: { icon: "📝", color: "text-blue-500" },
  APPROVAL:     { icon: "✅", color: "text-emerald-500" },
  REMINDER:     { icon: "🔔", color: "text-amber-500" },
  EVENT:        { icon: "🎮", color: "text-purple-500" },
  SYSTEM:       { icon: "⚙️", color: "text-[var(--muted-foreground)]" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDuration(start: Date | string, end: Date | string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(targetDate: Date | string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setTimeLeft({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000), expired: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

// ─── Countdown Display ────────────────────────────────────────────────────────
function CountdownDisplay({ targetDate }: { targetDate: Date | string }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(targetDate);
  if (expired) return <span className="text-xs text-[var(--muted-foreground)]">Event started</span>;
  return (
    <div className="flex items-center gap-1">
      {days > 0 && <CountUnit v={days} l="d" />}
      <CountUnit v={hours} l="h" />
      <CountUnit v={minutes} l="m" />
      <CountUnit v={seconds} l="s" />
    </div>
  );
}
function CountUnit({ v, l }: { v: number; l: string }) {
  return (
    <div className="flex flex-col items-center rounded bg-[var(--muted)]/60 px-1.5 py-0.5 min-w-[28px]">
      <span className="text-xs font-bold tabular-nums leading-none text-[var(--foreground)]">{String(v).padStart(2, "0")}</span>
      <span className="text-[8px] text-[var(--muted-foreground)]">{l}</span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color, loading }: { icon: string; label: string; value: number; color: string; loading: boolean }) {
  return (
    <motion.div variants={fadeUp}>
      <div className={`relative overflow-hidden rounded-2xl border bg-[var(--card)] p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-12" />
            ) : (
              <p className="mt-0.5 text-2xl font-bold text-[var(--foreground)]">{value}</p>
            )}
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
const TIMELINE_ACTIONS: Record<string, { label: string; icon: string; color: string }> = {
  SUBMITTED:        { label: "Registration Submitted",  icon: "📝", color: "bg-blue-500" },
  CREATED:          { label: "Registration Submitted",  icon: "📝", color: "bg-blue-500" },
  APPROVED:         { label: "Registration Approved",   icon: "✅", color: "bg-emerald-500" },
  REJECTED:         { label: "Registration Rejected",   icon: "❌", color: "bg-red-500" },
  WAITLISTED:       { label: "Added to Waitlist",       icon: "📋", color: "bg-blue-500" },
  REMINDER_SENT:    { label: "Reminder Sent",           icon: "🔔", color: "bg-amber-500" },
  CHECKED_IN:       { label: "Attendance Checked",      icon: "🎟️", color: "bg-purple-500" },
  EVENT_STARTED:    { label: "Event Started",           icon: "🎮", color: "bg-violet-500" },
  COMPLETED:        { label: "Event Completed",         icon: "🏁", color: "bg-purple-500" },
  CANCELLED:        { label: "Registration Cancelled",  icon: "🚫", color: "bg-[var(--muted-foreground)]" },
};

function RegistrationTimeline({ timeline }: { timeline: MyRegistration["timeline"] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">
        No timeline events yet
      </div>
    );
  }
  return (
    <div className="relative space-y-0">
      {timeline.map((entry, idx) => {
        const cfg = TIMELINE_ACTIONS[entry.action] ?? { label: entry.action, icon: "📌", color: "bg-[var(--muted-foreground)]" };
        const isLast = idx === timeline.length - 1;
        return (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${cfg.color} text-white shadow-sm`}>
                {cfg.icon}
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-[var(--border)] my-1" />}
            </div>
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <p className="text-sm font-medium text-[var(--foreground)]">{cfg.label}</p>
              {entry.actorName && (
                <p className="text-xs text-[var(--muted-foreground)]">by {entry.actorName}</p>
              )}
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatDateTime(entry.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Registration Details Modal ───────────────────────────────────────────────
function RegistrationDetailsModal({
  registration,
  onClose,
  onCancel,
}: {
  registration: MyRegistration;
  onClose: () => void;
  onCancel: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "notes">("info");
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const status = STATUS_CONFIG[registration.status] ?? STATUS_CONFIG.PENDING;
  const canCancel = !["CANCELLED", "COMPLETED", "CHECKED_IN"].includes(registration.status);
  const event = registration.event;

  const handleCancel = async () => {
    setCancelling(true);
    await onCancel(registration.id);
    setCancelling(false);
    setShowCancelConfirm(false);
    onClose();
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    const start = new Date(event.startDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = new Date(event.endDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(`Pass: ${registration.passNumber}`)}`;
    window.open(url, "_blank");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event?.title ?? "Event", text: `Check out this event: ${event?.title}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl flex flex-col"
        >
          {/* Banner */}
          <div className="relative h-40 shrink-0 overflow-hidden bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary)]/10 to-transparent">
            {event?.bannerUrl ? (
              <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Gamepad2 className="h-16 w-16 text-[var(--primary)]/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white line-clamp-1">{event?.title ?? "Event"}</h2>
                  <p className="text-xs text-white/70">{registration.festival.name}</p>
                </div>
                <StatusBadge status={registration.status} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)] shrink-0">
            {[
              { key: "info", label: "Details", icon: <ClipboardList className="h-3.5 w-3.5" /> },
              { key: "timeline", label: "Timeline", icon: <Timer className="h-3.5 w-3.5" /> },
              { key: "notes", label: "Staff Notes", icon: <MessageSquare className="h-3.5 w-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "info" && (
              <div className="space-y-5">
                {/* Participant Info */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Participant Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon="👤" label="Name" value={registration.fullName} />
                    <InfoRow icon="📧" label="Email" value={registration.email} />
                    <InfoRow icon="🎮" label="Interest" value={registration.interest} />
                    {registration.discordUsername && (
                      <InfoRow icon="💬" label="Discord" value={registration.discordUsername} />
                    )}
                  </div>
                </section>

                {/* Registration Info */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Registration Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon="🎟️" label="Pass Number" value={registration.passNumber} mono />
                    <InfoRow icon="📅" label="Registered" value={formatDateTime(registration.registeredAt)} />
                    {registration.approvedAt && (
                      <InfoRow icon="✅" label="Approved At" value={formatDateTime(registration.approvedAt)} />
                    )}
                    {registration.rejectedAt && (
                      <InfoRow icon="❌" label="Rejected At" value={formatDateTime(registration.rejectedAt)} />
                    )}
                    {registration.cancelReason && (
                      <div className="col-span-2">
                        <InfoRow icon="🚫" label="Cancel Reason" value={registration.cancelReason} />
                      </div>
                    )}
                  </div>
                </section>

                {/* Event Info */}
                {event && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Event Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoRow icon="📅" label="Date" value={formatDate(event.startDate)} />
                      <InfoRow icon="🕐" label="Time" value={formatTime(event.startDate)} />
                      <InfoRow icon="⏱️" label="Duration" value={formatDuration(event.startDate, event.endDate)} />
                      {event.location && <InfoRow icon="📍" label="Location" value={event.location} />}
                      {event.category && <InfoRow icon="🎯" label="Category" value={event.category.name} />}
                      {event.status === "LIVE" && (
                        <div className="col-span-2 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2">
                          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                          <span className="text-sm font-semibold text-red-500">Event is LIVE now!</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Attendance */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Attendance Status</h3>
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3">
                    {registration.checkedInAt ? (
                      <>
                        <UserCheck className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-medium text-emerald-500">Checked In</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{formatDateTime(registration.checkedInAt)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-[var(--muted-foreground)]" />
                        <p className="text-sm text-[var(--muted-foreground)]">Not yet checked in</p>
                      </>
                    )}
                  </div>
                </section>

                {/* Discord Voice Channel */}
                {(event?.discordVoiceChannelId || registration.discordChannelId) && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Discord</h3>
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3">
                      <MessageSquare className="h-5 w-5 text-[var(--primary)]" />
                      <div>
                        <p className="text-sm font-medium">Voice Channel Assigned</p>
                        <p className="text-xs font-mono text-[var(--muted-foreground)]">
                          {event?.discordVoiceChannelId ?? registration.discordChannelId}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Countdown */}
                {event && new Date(event.startDate) > new Date() && registration.status === "APPROVED" && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Event Countdown</h3>
                    <div className="flex items-center gap-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3">
                      <Timer className="h-4 w-4 text-[var(--primary)]" />
                      <CountdownDisplay targetDate={event.startDate} />
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <RegistrationTimeline timeline={registration.timeline} />
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                {registration.notesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-10 w-10 text-[var(--muted-foreground)]/30 mb-3" />
                    <p className="text-sm text-[var(--muted-foreground)]">No notes from staff yet</p>
                  </div>
                ) : (
                  registration.notesList.map((note) => (
                    <div key={note.id} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                          {note.author.username[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-medium">{note.author.username}</span>
                        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{timeAgo(note.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)]">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 border-t border-[var(--border)] p-4">
            {showCancelConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-[var(--foreground)]">Are you sure you want to cancel this registration?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    Keep Registration
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {cancelling ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {event && (
                  <Link
                    href={`/dashboard/events`}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Event
                  </Link>
                )}
                <button
                  onClick={handleAddToCalendar}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Add to Calendar
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
                {registration.status === "APPROVED" && (
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-2 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Ticket
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors ml-auto"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel Registration
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2">
      <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">{icon} {label}</p>
      <p className={`mt-0.5 text-sm font-medium text-[var(--foreground)] truncate ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

// ─── Registration Card ────────────────────────────────────────────────────────
function RegistrationCard({
  registration,
  onViewDetails,
  onCancel,
}: {
  registration: MyRegistration;
  onViewDetails: (reg: MyRegistration) => void;
  onCancel: (id: string) => void;
}) {
  const event = registration.event;
  const isUpcoming = event && new Date(event.startDate) > new Date();
  const isLive = event?.status === "LIVE";
  const canCancel = !["CANCELLED", "COMPLETED", "CHECKED_IN"].includes(registration.status);

  return (
    <motion.div variants={fadeUp} className="group">
      <div
        className={`relative overflow-hidden rounded-2xl border bg-[var(--card)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5 ${
          isLive ? "border-red-500/40 shadow-sm shadow-red-500/10" : "border-[var(--border)] hover:border-[var(--primary)]/30"
        }`}
      >
        {/* Banner */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary)]/10 to-transparent">
          {event?.bannerUrl ? (
            <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Gamepad2 className="h-10 w-10 text-[var(--primary)]/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* LIVE badge */}
          {isLive && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </div>
          )}

          {/* Category */}
          {event?.category && (
            <div className="absolute bottom-3 left-3">
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                {event.category.emoji} {event.category.name}
              </span>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute right-3 top-3">
            <StatusBadge status={registration.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors text-sm">
              {event?.title ?? "Event unavailable"}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
              <Trophy className="h-3 w-3" /> {registration.festival.name}
            </p>
          </div>

          {/* Date / Time / Duration */}
          {event && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.startDate)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(event.startDate)}</span>
              <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{formatDuration(event.startDate, event.endDate)}</span>
            </div>
          )}

          {/* Registration date */}
          <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
            <Ticket className="h-3 w-3" />
            Registered {timeAgo(registration.registeredAt)} • <span className="font-mono">{registration.passNumber}</span>
          </p>

          {/* Countdown */}
          {isUpcoming && registration.status === "APPROVED" && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/15 px-2.5 py-1.5">
              <Timer className="h-3 w-3 text-[var(--primary)]" />
              <CountdownDisplay targetDate={event!.startDate} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => onViewDetails(registration)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Eye className="h-3 w-3" /> View Registration
            </button>
            {event && (
              <Link
                href="/dashboard/events"
                className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <Gamepad2 className="h-3 w-3" /> View Event
              </Link>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(registration.id)}
                className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
              >
                <XCircle className="h-3 w-3" /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────
function NotificationsPanel({ notifications }: { notifications: RegistrationNotification[] }) {
  if (notifications.length === 0) return null;
  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-[var(--primary)]" />
        <h3 className="text-sm font-semibold">Recent Notifications</h3>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">{notifications.length} new</span>
      </div>
      <div className="space-y-2">
        {notifications.slice(0, 5).map((notif) => {
          const cfg = NOTIF_CONFIG[notif.type] ?? NOTIF_CONFIG.SYSTEM;
          return (
            <div key={notif.id} className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors ${notif.isRead ? "opacity-60" : "bg-[var(--muted)]/30"}`}>
              <span className="text-base mt-0.5">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--foreground)] line-clamp-1">{notif.title}</p>
                {notif.message && <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">{notif.message}</p>}
              </div>
              <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{timeAgo(notif.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [summary, setSummary] = useState<RegistrationSummary | null>(null);
  const [notifications, setNotifications] = useState<RegistrationNotification[]>([]);
  const [festivals, setFestivals] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<MyRegistration | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "upcoming" | "completed">("newest");
  const [festivalFilter, setFestivalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // Fetch registrations
  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusFilter = activeTab === "ALL" || activeTab === "UPCOMING" ? undefined : activeTab;
      const result = await getMyRegistrationsFull({
        status: statusFilter,
        festivalId: festivalFilter || undefined,
        search: debouncedSearch || undefined,
        sortBy,
        page,
        pageSize: 12,
      });
      if (!result.success) {
        if (result.code === "UNAUTHORIZED") { window.location.href = "/login"; return; }
        setError(result.error ?? "Failed to load registrations");
        return;
      }
      const data = result.data as { registrations: MyRegistration[]; total: number; page: number; totalPages: number };
      let regs = data.registrations;
      // Client-side filter for UPCOMING tab
      if (activeTab === "UPCOMING") {
        const now = new Date();
        regs = regs.filter((r) => r.event && new Date(r.event.startDate) > now && ["APPROVED", "PENDING", "WAITLISTED"].includes(r.status));
      }
      setRegistrations(regs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError("Something went wrong loading your registrations");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, debouncedSearch, sortBy, festivalFilter, page]);

  // Fetch summary + notifications + festivals once
  useEffect(() => {
    setSummaryLoading(true);
    Promise.all([
      getMyRegistrationSummary(),
      getMyRegistrationNotifications(),
      getMyFestivals(),
    ]).then(([summaryRes, notifRes, festRes]) => {
      if (summaryRes.success) setSummary(summaryRes.data as RegistrationSummary);
      if (notifRes.success) setNotifications(notifRes.data as RegistrationNotification[]);
      if (festRes.success) setFestivals(festRes.data as Array<{ id: string; name: string }>);
      setSummaryLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch, sortBy, festivalFilter]);

  const handleCancel = async (id: string) => {
    setCancelling(true);
    const result = await cancelMyRegistration(id, "Cancelled by participant");
    setCancelling(false);
    setCancelConfirmId(null);
    if (result.success) {
      fetchRegistrations();
      getMyRegistrationSummary().then((r) => { if (r.success) setSummary(r.data as RegistrationSummary); });
    }
  };

  const handleCancelClick = (id: string) => {
    setCancelConfirmId(id);
  };

  const summaryCards = [
    { icon: "📋", label: "Total Registrations", value: summary?.total ?? 0, color: "border-[var(--border)]" },
    { icon: "📅", label: "Upcoming Events",      value: summary?.upcoming ?? 0, color: "border-blue-500/20 bg-blue-500/5" },
    { icon: "⏳", label: "Pending Approvals",    value: summary?.pending ?? 0, color: "border-amber-500/20 bg-amber-500/5" },
    { icon: "✅", label: "Approved",             value: summary?.approved ?? 0, color: "border-emerald-500/20 bg-emerald-500/5" },
    { icon: "📋", label: "Waitlisted",           value: summary?.waitlisted ?? 0, color: "border-blue-500/20 bg-blue-500/5" },
    { icon: "❌", label: "Rejected",             value: summary?.rejected ?? 0, color: "border-red-500/20 bg-red-500/5" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">📝 My Registrations</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">View and manage all your event registrations in one place.</p>
          </div>
          <button
            onClick={fetchRegistrations}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} loading={summaryLoading} />
        ))}
      </motion.div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <NotificationsPanel notifications={notifications} />
        </motion.div>
      )}

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by event name, game, festival..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              showFilters ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-3 pr-8 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">Festival:</span>
                  <select
                    value={festivalFilter}
                    onChange={(e) => setFestivalFilter(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">All Festivals</option>
                    {festivals.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                {(festivalFilter) && (
                  <button
                    onClick={() => { setFestivalFilter(""); }}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X className="h-3 w-3" /> Clear Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 scrollbar-hide">
          {TABS.map((tab) => {
            const count = tab.key === "ALL" ? summary?.total
              : tab.key === "UPCOMING" ? summary?.upcoming
              : tab.key === "APPROVED" ? summary?.approved
              : tab.key === "PENDING" ? summary?.pending
              : tab.key === "WAITLISTED" ? summary?.waitlisted
              : tab.key === "REJECTED" ? summary?.rejected
              : tab.key === "COMPLETED" ? summary?.completed
              : tab.key === "CANCELLED" ? summary?.cancelled
              : undefined;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500/50 mb-4" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{error}</p>
          <button onClick={fetchRegistrations} className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
            Try Again
          </button>
        </div>
      ) : registrations.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-16 text-center">
            <div className="relative mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/20">
                <ClipboardList className="h-10 w-10 text-[var(--primary)]/50" />
              </div>
              <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)]">
                <span className="text-lg">📭</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-[var(--foreground)]">
              {activeTab === "ALL" ? "No registrations yet" : `No ${activeTab.toLowerCase()} registrations`}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
              {activeTab === "ALL" ?"You haven't registered for any events yet. Browse available events and sign up to get started!"
                : `You don't have any ${activeTab.toLowerCase()} registrations at the moment.`}
            </p>
            {activeTab === "ALL" && (
              <Link
                href="/dashboard/events"
                className="mt-6 flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                <Gamepad2 className="h-4 w-4" /> Browse Events
              </Link>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registrations.map((reg) => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                onViewDetails={setSelectedReg}
                onCancel={handleCancelClick}
              />
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        p === page ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
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
                className="flex items-center gap-1 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-xs text-[var(--muted-foreground)] ml-2">
                {total} total
              </span>
            </motion.div>
          )}
        </>
      )}

      {/* Cancel Confirm Inline */}
      <AnimatePresence>
        {cancelConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                  <XCircle className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold">Cancel Registration?</h3>
                <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone. Your spot may be given to someone on the waitlist.</p>
                <div className="flex w-full gap-2 mt-2">
                  <button
                    onClick={() => setCancelConfirmId(null)}
                    className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                  >
                    Keep It
                  </button>
                  <button
                    onClick={() => handleCancel(cancelConfirmId)}
                    disabled={cancelling}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Registration"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Details Modal */}
      {selectedReg && (
        <RegistrationDetailsModal
          registration={selectedReg}
          onClose={() => setSelectedReg(null)}
          onCancel={async (id) => {
            await handleCancel(id);
            setSelectedReg(null);
          }}
        />
      )}
    </div>
  );
}

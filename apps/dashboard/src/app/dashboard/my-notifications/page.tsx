"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Search, Trash2, MailOpen, Mail, CheckCheck, ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc, X, Calendar, Trophy, Star, Zap, AlertTriangle, Info, Shield, Gamepad2, Users, Award, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink, ChevronDown,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Badge } from "@gameverse/ui/badge";
import { Skeleton } from "@gameverse/ui/skeleton";
import { Separator } from "@gameverse/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gameverse/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";

import {
  getParticipantNotifications,
  getParticipantNotificationStats,
  markParticipantNotificationRead,
  markAllParticipantNotificationsRead,
  deleteParticipantNotification,
  deleteAllReadParticipantNotifications,
  deleteCategoryParticipantNotifications,
} from "./_actions/participant-notifications";

import type { NotificationListItem, NotificationType } from "@gameverse/types";

// =====================================================
// Types & Constants
// =====================================================

interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  archivedNotifications: number;
  todayNotifications: number;
  byType: Record<string, number>;
}

type PriorityLevel = "low" | "normal" | "important" | "critical";
type CategoryTab = "ALL" | NotificationType;
type SortOption = "newest" | "oldest" | "priority";
type ReadFilter = "ALL" | "READ" | "UNREAD";

interface EnrichedNotification extends NotificationListItem {
  priority: PriorityLevel;
  category: CategoryTab;
  festivalName?: string;
  relatedEvent?: string;
  notificationSubType?: string;
}

const CATEGORY_TABS: { value: CategoryTab; label: string; emoji: string }[] = [
  { value: "ALL", label: "All", emoji: "🔔" },
  { value: "FESTIVAL", label: "Festival", emoji: "🎪" },
  { value: "EVENT", label: "Events", emoji: "📅" },
  { value: "REGISTRATION", label: "Registrations", emoji: "📝" },
  { value: "APPROVAL", label: "Leaderboard", emoji: "🏆" },
  { value: "SYSTEM", label: "System", emoji: "⚙️" },
  { value: "ANNOUNCEMENT", label: "Profile", emoji: "👤" },
  { value: "REMINDER", label: "Reminders", emoji: "⏰" },
];

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; bgColor: string; icon: React.ReactNode; dotColor: string }> = {
  low: {
    label: "Low",
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    icon: <Info className="h-3 w-3" />,
    dotColor: "bg-slate-400",
  },
  normal: {
    label: "Normal",
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    icon: <Bell className="h-3 w-3" />,
    dotColor: "bg-blue-500",
  },
  important: {
    label: "Important",
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    icon: <AlertCircle className="h-3 w-3" />,
    dotColor: "bg-amber-500",
  },
  critical: {
    label: "Critical",
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    icon: <AlertTriangle className="h-3 w-3" />,
    dotColor: "bg-red-500",
  },
};

const NOTIFICATION_SUBTYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; priority: PriorityLevel }> = {
  FESTIVAL_ANNOUNCEMENT: { icon: <Star className="h-4 w-4 text-pink-500" />, label: "Festival Announcement", priority: "important" },
  EVENT_CREATED: { icon: <Calendar className="h-4 w-4 text-blue-500" />, label: "Event Created", priority: "normal" },
  REGISTRATION_APPROVED: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: "Registration Approved", priority: "important" },
  REGISTRATION_REJECTED: { icon: <XCircle className="h-4 w-4 text-red-500" />, label: "Registration Rejected", priority: "critical" },
  REGISTRATION_WAITLISTED: { icon: <Clock className="h-4 w-4 text-amber-500" />, label: "Waitlisted", priority: "normal" },
  REGISTRATION_CANCELLED: { icon: <XCircle className="h-4 w-4 text-slate-500" />, label: "Registration Cancelled", priority: "important" },
  EVENT_REMINDER: { icon: <Clock className="h-4 w-4 text-amber-500" />, label: "Event Reminder", priority: "important" },
  EVENT_STARTING_SOON: { icon: <Zap className="h-4 w-4 text-amber-500" />, label: "Starting Soon", priority: "critical" },
  EVENT_LIVE: { icon: <Zap className="h-4 w-4 text-green-500" />, label: "Event Live", priority: "critical" },
  EVENT_RESCHEDULED: { icon: <RefreshCw className="h-4 w-4 text-blue-500" />, label: "Rescheduled", priority: "important" },
  EVENT_CANCELLED: { icon: <XCircle className="h-4 w-4 text-red-500" />, label: "Event Cancelled", priority: "critical" },
  ATTENDANCE_CONFIRMED: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: "Attendance Confirmed", priority: "normal" },
  POINTS_AWARDED: { icon: <Star className="h-4 w-4 text-yellow-500" />, label: "Points Awarded", priority: "normal" },
  LEADERBOARD_UPDATED: { icon: <Trophy className="h-4 w-4 text-amber-500" />, label: "Leaderboard Updated", priority: "normal" },
  RANK_INCREASED: { icon: <TrendingUp className="h-4 w-4 text-green-500" />, label: "Rank Increased", priority: "important" },
  RANK_DECREASED: { icon: <TrendingDown className="h-4 w-4 text-red-500" />, label: "Rank Decreased", priority: "normal" },
  ACHIEVEMENT_UNLOCKED: { icon: <Award className="h-4 w-4 text-purple-500" />, label: "Achievement Unlocked", priority: "important" },
  BADGE_UNLOCKED: { icon: <Shield className="h-4 w-4 text-indigo-500" />, label: "Badge Unlocked", priority: "important" },
  PROFILE_UPDATED: { icon: <Users className="h-4 w-4 text-blue-500" />, label: "Profile Updated", priority: "low" },
  SYSTEM_ANNOUNCEMENT: { icon: <Bell className="h-4 w-4 text-slate-500" />, label: "System Announcement", priority: "normal" },
  MAINTENANCE_NOTICE: { icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, label: "Maintenance Notice", priority: "critical" },
};

function getNotificationIcon(notification: NotificationListItem): React.ReactNode {
  const meta = notification.metadata as Record<string, string> | null;
  const subType = meta?.subType as string | undefined;
  if (subType && NOTIFICATION_SUBTYPE_CONFIG[subType]) {
    return NOTIFICATION_SUBTYPE_CONFIG[subType].icon;
  }
  const typeIconMap: Record<string, React.ReactNode> = {
    FESTIVAL: <Star className="h-4 w-4 text-pink-500" />,
    EVENT: <Calendar className="h-4 w-4 text-blue-500" />,
    REGISTRATION: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    APPROVAL: <Trophy className="h-4 w-4 text-amber-500" />,
    REMINDER: <Clock className="h-4 w-4 text-amber-500" />,
    SYSTEM: <Shield className="h-4 w-4 text-slate-500" />,
    ANNOUNCEMENT: <Bell className="h-4 w-4 text-blue-500" />,
    CUSTOM: <Gamepad2 className="h-4 w-4 text-purple-500" />,
  };
  return typeIconMap[notification.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />;
}

function getNotificationPriority(notification: NotificationListItem): PriorityLevel {
  const meta = notification.metadata as Record<string, string> | null;
  if (meta?.priority) return meta.priority as PriorityLevel;
  const subType = meta?.subType as string | undefined;
  if (subType && NOTIFICATION_SUBTYPE_CONFIG[subType]) {
    return NOTIFICATION_SUBTYPE_CONFIG[subType].priority;
  }
  const criticalTypes = ["EVENT_STARTING_SOON", "EVENT_LIVE", "EVENT_CANCELLED", "REGISTRATION_REJECTED", "MAINTENANCE_NOTICE"];
  const importantTypes = ["REGISTRATION_APPROVED", "FESTIVAL_ANNOUNCEMENT", "RANK_INCREASED", "ACHIEVEMENT_UNLOCKED", "BADGE_UNLOCKED"];
  if (notification.type === "SYSTEM") return "important";
  if (notification.type === "REMINDER") return "important";
  return "normal";
}

function enrichNotification(n: NotificationListItem): EnrichedNotification {
  const meta = n.metadata as Record<string, string> | null;
  return {
    ...n,
    priority: getNotificationPriority(n),
    category: n.type as CategoryTab,
    festivalName: meta?.festivalName,
    relatedEvent: meta?.eventName,
    notificationSubType: meta?.subType,
  };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// =====================================================
// Skeleton Loading
// =====================================================
function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 rounded-xl border border-border/50 p-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Empty State
// =====================================================
function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
          <Bell className="h-10 w-10 text-primary/60" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <BellOff className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground">No notifications yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        You're all caught up! Notifications about events, registrations, and achievements will appear here.
      </p>
      <Button className="mt-6" onClick={onBrowse}>
        <Gamepad2 className="mr-2 h-4 w-4" />
        Browse Events
      </Button>
    </motion.div>
  );
}

// =====================================================
// Notification Detail Panel
// =====================================================
function NotificationDetailPanel({
  notification,
  onClose,
  onMarkRead,
  onDelete,
}: {
  notification: EnrichedNotification;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const priority = PRIORITY_CONFIG[notification.priority];
  const icon = getNotificationIcon(notification);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col rounded-xl border border-border bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-semibold text-foreground">Notification Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Icon + Title */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground leading-snug">{notification.title}</h4>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${priority.bgColor}`}>
                {priority.icon}
                {priority.label}
              </span>
              {!notification.isRead && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Unread
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Full Message */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Message</p>
          <p className="text-sm text-foreground leading-relaxed">{notification.message}</p>
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          {notification.festivalName && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <Star className="h-4 w-4 text-pink-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Festival</p>
                <p className="text-sm font-medium text-foreground">{notification.festivalName}</p>
              </div>
            </div>
          )}
          {notification.relatedEvent && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Related Event</p>
                <p className="text-sm font-medium text-foreground truncate">{notification.relatedEvent}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(notification.createdAt).toLocaleString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {notification.link && (
          <Button
            className="w-full"
            onClick={() => {
              if (notification.link) router.push(notification.link);
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {notification.relatedEvent ? "Open Event" : "View Details"}
          </Button>
        )}
        {!notification.link && notification.type === "APPROVAL" && (
          <Button className="w-full" variant="outline" onClick={() => router.push("/dashboard/leaderboard")}>
            <Trophy className="mr-2 h-4 w-4" />
            Open Leaderboard
          </Button>
        )}
        {!notification.link && notification.type === "ANNOUNCEMENT" && (
          <Button className="w-full" variant="outline" onClick={() => router.push("/dashboard/settings/profile")}>
            <Users className="mr-2 h-4 w-4" />
            Open Profile
          </Button>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4 flex gap-2">
        {!notification.isRead ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onMarkRead(notification.id)}
          >
            <MailOpen className="mr-2 h-3.5 w-3.5" />
            Mark as Read
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onMarkRead(notification.id)}
          >
            <Mail className="mr-2 h-3.5 w-3.5" />
            Mark Unread
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            onDelete(notification.id);
            onClose();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// =====================================================
// Notification Card
// =====================================================
function NotificationCard({
  notification,
  isSelected,
  onSelect,
  onMarkRead,
  onDelete,
  onClick,
}: {
  notification: EnrichedNotification;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (n: EnrichedNotification) => void;
}) {
  const priority = PRIORITY_CONFIG[notification.priority];
  const icon = getNotificationIcon(notification);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm ${
        isSelected
          ? "border-primary/50 bg-primary/5"
          : !notification.isRead
          ? "border-border bg-card shadow-sm"
          : "border-border/50 bg-card/50 hover:bg-card"
      }`}
      onClick={() => onClick(notification)}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className={`absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full ${priority.dotColor}`} />
      )}

      {/* Checkbox */}
      <div
        className="mt-0.5 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(notification.id);
        }}
      >
        <div
          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
            isSelected
              ? "border-primary bg-primary" :"border-border bg-background hover:border-primary/50"
          }`}
        >
          {isSelected && <CheckCheck className="h-2.5 w-2.5 text-primary-foreground" />}
        </div>
      </div>

      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          !notification.isRead ? "bg-primary/10" : "bg-muted"
        }`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-semibold leading-snug ${
                  !notification.isRead ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {notification.title}
              </span>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        {/* Tags row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${priority.bgColor}`}>
            {priority.icon}
            {priority.label}
          </span>
          {notification.festivalName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 text-xs text-pink-700 dark:text-pink-300">
              <Star className="h-2.5 w-2.5" />
              {notification.festivalName}
            </span>
          )}
          {notification.relatedEvent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
              <Calendar className="h-2.5 w-2.5" />
              {notification.relatedEvent}
            </span>
          )}
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div
        className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.isRead ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Mark as read"
            onClick={() => onMarkRead(notification.id)}
          >
            <MailOpen className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Mark as unread"
            onClick={() => onMarkRead(notification.id)}
          >
            <Mail className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          title="Delete"
          onClick={() => onDelete(notification.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// =====================================================
// Main Page
// =====================================================
export default function ParticipantNotificationCenter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("ALL");
  const [selectedNotification, setSelectedNotification] = useState<EnrichedNotification | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    readFilter: "ALL" as ReadFilter,
    sortBy: "newest" as SortOption,
    dateFrom: "",
    dateTo: "",
  });

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const typeFilter = activeCategory === "ALL" ? undefined : activeCategory as NotificationType;
      const sortMap: Record<SortOption, { sortBy: "createdAt" | "title"; sortOrder: "asc" | "desc" }> = {
        newest: { sortBy: "createdAt", sortOrder: "desc" },
        oldest: { sortBy: "createdAt", sortOrder: "asc" },
        priority: { sortBy: "createdAt", sortOrder: "desc" },
      };
      const sort = sortMap[filters.sortBy];

      const result = await getParticipantNotifications({
        type: typeFilter,
        isRead: filters.readFilter === "ALL" ? undefined : filters.readFilter === "READ",
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        page: pagination.page,
        perPage: pagination.perPage,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });

      if (result.success && result.data) {
        const data = result.data as { notifications: NotificationListItem[]; total: number; totalPages: number };
        let enriched = data.notifications.map(enrichNotification);

        // Client-side search filter
        if (filters.search) {
          const q = filters.search.toLowerCase();
          enriched = enriched.filter(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              n.message.toLowerCase().includes(q) ||
              n.festivalName?.toLowerCase().includes(q) ||
              n.relatedEvent?.toLowerCase().includes(q)
          );
        }

        // Sort by priority if selected
        if (filters.sortBy === "priority") {
          const priorityOrder: Record<PriorityLevel, number> = { critical: 0, important: 1, normal: 2, low: 3 };
          enriched.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        }

        setNotifications(enriched);
        setPagination((prev) => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [activeCategory, filters, pagination.page, pagination.perPage]);

  const fetchStats = useCallback(async () => {
    const result = await getParticipantNotificationStats();
    if (result.success && result.data) {
      setStats(result.data as NotificationStats);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time polling for unread count
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchStats();
      fetchNotifications(true);
    }, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchStats, fetchNotifications]);

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markParticipantNotificationRead(id);
      fetchNotifications(true);
      fetchStats();
      if (selectedNotification?.id === id) {
        setSelectedNotification((prev) => prev ? { ...prev, isRead: !prev.isRead } : null);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteParticipantNotification(id);
      fetchNotifications(true);
      fetchStats();
      if (selectedNotification?.id === id) setSelectedNotification(null);
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllParticipantNotificationsRead();
      fetchNotifications(true);
      fetchStats();
    });
  };

  const handleDeleteAllRead = () => {
    startTransition(async () => {
      await deleteAllReadParticipantNotifications();
      fetchNotifications(true);
      fetchStats();
    });
  };

  const handleClearCategory = () => {
    if (activeCategory === "ALL") return;
    startTransition(async () => {
      await deleteCategoryParticipantNotifications(activeCategory as NotificationType);
      fetchNotifications(true);
      fetchStats();
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleBulkMarkRead = () => {
    startTransition(async () => {
      for (const id of selectedIds) {
        await markParticipantNotificationRead(id);
      }
      setSelectedIds([]);
      fetchNotifications(true);
      fetchStats();
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      for (const id of selectedIds) {
        await deleteParticipantNotification(id);
      }
      setSelectedIds([]);
      fetchNotifications(true);
      fetchStats();
    });
  };

  const unreadCount = stats?.unreadNotifications ?? 0;

  return (
    <div className="flex h-full flex-col gap-0">
      {/* ── Header ── */}
      <div className="border-b border-border bg-card/50 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  🔔 Notifications
                </h1>
                <p className="text-sm text-muted-foreground">
                  Stay updated with everything happening during GameVerse Festival.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none">Total</p>
                  <p className="text-sm font-bold text-foreground">{stats.totalNotifications}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 leading-none">Unread</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{stats.unreadNotifications}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none">Today</p>
                  <p className="text-sm font-bold text-foreground">{stats.todayNotifications ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="border-b border-border bg-card/30 px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const count = tab.value === "ALL"
              ? stats?.totalNotifications
              : stats?.byType?.[tab.value];
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveCategory(tab.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      activeCategory === tab.value
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="border-b border-border bg-background px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, event, festival..."
              value={filters.search}
              onChange={(e) => {
                setFilters((p) => ({ ...p, search: e.target.value }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="pl-9 h-9"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((p) => ({ ...p, search: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Read Filter */}
            <Select
              value={filters.readFilter}
              onValueChange={(v) => {
                setFilters((p) => ({ ...p, readFilter: v as ReadFilter }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="UNREAD">Unread</SelectItem>
                <SelectItem value="READ">Read</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={filters.sortBy}
              onValueChange={(v) => setFilters((p) => ({ ...p, sortBy: v as SortOption }))}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <span className="flex items-center gap-2"><SortDesc className="h-3.5 w-3.5" />Newest First</span>
                </SelectItem>
                <SelectItem value="oldest">
                  <span className="flex items-center gap-2"><SortAsc className="h-3.5 w-3.5" />Oldest First</span>
                </SelectItem>
                <SelectItem value="priority">
                  <span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />Priority</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter Toggle */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFilters((p) => !p)}
            >
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filters
              {(filters.dateFrom || filters.dateTo) && (
                <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>

            {/* Bulk Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Actions
                  <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkAllRead} disabled={isPending || unreadCount === 0}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteAllRead} disabled={isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Read
                </DropdownMenuItem>
                {activeCategory !== "ALL" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearCategory} disabled={isPending} className="text-destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Clear Category
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Date Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">From</span>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                    className="h-8 w-[150px] text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">To</span>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                    className="h-8 w-[150px] text-sm"
                  />
                </div>
                {(filters.dateFrom || filters.dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setFilters((p) => ({ ...p, dateFrom: "", dateTo: "" }))}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Clear dates
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Notification List */}
        <div className={`flex flex-col overflow-hidden ${selectedNotification ? "hidden lg:flex lg:flex-1" : "flex-1"}`}>
          {/* Bulk selection bar */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-border bg-primary/5 px-6 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {selectedIds.length} selected
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <Button variant="ghost" size="sm" onClick={handleBulkMarkRead} disabled={isPending}>
                    <MailOpen className="mr-1.5 h-3.5 w-3.5" />
                    Mark Read
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleBulkDelete} disabled={isPending} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Select all row */}
          {notifications.length > 0 && !isLoading && (
            <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 px-6 py-2">
              <div
                className="flex cursor-pointer items-center gap-2"
                onClick={handleSelectAll}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    selectedIds.length === notifications.length && notifications.length > 0
                      ? "border-primary bg-primary" :"border-border bg-background"
                  }`}
                >
                  {selectedIds.length === notifications.length && notifications.length > 0 && (
                    <CheckCheck className="h-2.5 w-2.5 text-primary-foreground" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                {pagination.total} notification{pagination.total !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <EmptyState onBrowse={() => router.push("/dashboard/events")} />
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {notifications.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      isSelected={selectedIds.includes(n.id)}
                      onSelect={(id) =>
                        setSelectedIds((prev) =>
                          prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                        )
                      }
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                      onClick={(notif) => {
                        setSelectedNotification(notif);
                        if (!notif.isRead) handleMarkRead(notif.id);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-t border-border px-6 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.perPage + 1}–
                  {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-foreground">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNotification && (
            <div className="w-full lg:w-[380px] lg:shrink-0 border-l border-border overflow-hidden">
              <NotificationDetailPanel
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

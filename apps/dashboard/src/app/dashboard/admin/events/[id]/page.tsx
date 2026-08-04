"use client";

import { useState, useEffect, useCallback, use, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Archive, Calendar, MapPin, MessageSquare, Users, Settings, Image, ExternalLink, Play, Pause, CheckCircle2, XCircle, RotateCcw, Copy, Radio, Timer, Trophy, FileText, Bell, BarChart3, Globe, Eye, EyeOff, Star, Hash, Activity,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gameverse/ui/card";

import { Skeleton } from "@gameverse/ui/skeleton";

import { getEventById, deleteEvent, publishEvent, unpublishEvent, archiveEvent, restoreEvent, bulkUpdateEventStatus,  } from "../_actions/event";
import { DeleteEventDialog, PublishEventDialog, DuplicateEventDialog } from "../_components";
import type { CommunityEventWithRelations } from "@gameverse/types";
import { EVENT_VISIBILITY_LABELS, EVENT_VISIBILITY_COLORS, TIMEZONE_OPTIONS } from "@gameverse/types";

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  DRAFT: { label: "Draft", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", dot: "bg-slate-400" },
  PUBLISHED: { label: "Registration Open", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400 animate-pulse" },
  LIVE: { label: "Live", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", dot: "bg-green-400 animate-pulse" },
  COMPLETED: { label: "Completed", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-400" },
  CANCELLED: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" },
  ARCHIVED: { label: "Archived", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20", dot: "bg-zinc-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "participants", label: "Participants", icon: Users },
  { id: "registrations", label: "Registrations", icon: FileText },
  { id: "attendance", label: "Attendance", icon: CheckCircle2 },
  { id: "points", label: "Points", icon: Star },
  { id: "results", label: "Results", icon: Trophy },
  { id: "media", label: "Media", icon: Image },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

// ─── Timeline Events ──────────────────────────────────────────────────────────
function buildTimeline(event: CommunityEventWithRelations) {
  const items: { label: string; date: Date | null; icon: React.ReactNode; color: string }[] = [
    { label: "Event Created", date: event.createdAt, icon: <FileText className="h-4 w-4" />, color: "bg-slate-500" },
    { label: "Registration Opened", date: event.registrationStart, icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-emerald-500" },
    { label: "Registration Closed", date: event.registrationEnd, icon: <XCircle className="h-4 w-4" />, color: "bg-amber-500" },
    { label: "Event Started", date: event.startDate, icon: <Play className="h-4 w-4" />, color: "bg-green-500" },
    { label: "Event Ended", date: event.endDate, icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-purple-500" },
    ...(event.status === "ARCHIVED" ? [{ label: "Archived", date: event.updatedAt, icon: <Archive className="h-4 w-4" />, color: "bg-zinc-500" }] : []),
  ].filter(i => i.date);
  return items.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState<CommunityEventWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    const result = await getEventById(id);
    if (result.success && result.data) setEvent(result.data);
    else setError(result.success ? "" : (result.error ?? "Failed to load event"));
    setIsLoading(false);
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  // Live elapsed timer
  useEffect(() => {
    if (!event || event.status !== "LIVE") return;
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(event.startDate).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${h > 0 ? h + "h " : ""}${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleAction = (action: () => Promise<any>) => {
    startTransition(async () => { await action(); fetchEvent(); });
  };

  const fmt = (d: Date | null | undefined) => d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const fmtTime = (d: Date | null | undefined) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  const fmtDT = (d: Date | null | undefined) => d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const getDuration = () => {
    if (!event) return "—";
    const diff = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const getTZ = (tz: string) => TIMEZONE_OPTIONS.find(t => t.value === tz)?.label || tz;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-10 w-10" /><div className="space-y-2"><Skeleton className="h-8 w-[300px]" /><Skeleton className="h-4 w-[200px]" /></div></div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin/events")}><ArrowLeft className="h-4 w-4" /></Button>
        <p className="text-destructive">{error || "Event not found"}</p>
      </div>
    );
  }

  const timeline = buildTimeline(event);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border">
        <div className="h-48 bg-gradient-to-br from-primary/30 via-primary/10 to-background">
          {event.bannerUrl && <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover opacity-60" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="icon" className="shrink-0 bg-background/50 backdrop-blur" onClick={() => router.push("/dashboard/admin/events")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <StatusBadge status={event.status} />
                  {event.isFeatured && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⭐ Featured</Badge>}
                  {event.status === "LIVE" && elapsedTime && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                      <Timer className="h-3 w-3" />{elapsedTime}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold">
                  {event.category?.emoji && <span className="mr-2">{event.category.emoji}</span>}
                  {event.title}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">{event.festival?.name} · {event.shortDescription || event.slug}</p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/events/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />Edit
              </Button>
              {event.status === "DRAFT" && (
                <Button size="sm" onClick={() => setPublishDialogOpen(true)}>
                  <Globe className="mr-2 h-4 w-4" />Publish
                </Button>
              )}
              {event.status === "PUBLISHED" && (
                <Button size="sm" variant="outline" onClick={() => handleAction(() => bulkUpdateEventStatus([id], "LIVE"))}>
                  <Radio className="mr-2 h-4 w-4" />Start Event
                </Button>
              )}
              {event.status === "LIVE" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleAction(() => bulkUpdateEventStatus([id], "COMPLETED"))}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />End Event
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(() => bulkUpdateEventStatus([id], "CANCELLED"))}>
                    <Pause className="mr-2 h-4 w-4" />Pause
                  </Button>
                </>
              )}
              {event.status === "PUBLISHED" && (
                <Button size="sm" variant="outline" onClick={() => setPublishDialogOpen(true)}>
                  <EyeOff className="mr-2 h-4 w-4" />Unpublish
                </Button>
              )}
              {event.status !== "ARCHIVED" && (
                <Button size="sm" variant="outline" onClick={() => handleAction(() => archiveEvent(id))}>
                  <Archive className="mr-2 h-4 w-4" />Archive
                </Button>
              )}
              {event.status === "ARCHIVED" && (
                <Button size="sm" variant="outline" onClick={() => handleAction(() => restoreEvent(id))}>
                  <RotateCcw className="mr-2 h-4 w-4" />Restore
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setDuplicateDialogOpen(true)}>
                <Copy className="mr-2 h-4 w-4" />Duplicate
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Participants", value: event._count?.rsvps || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Max Slots", value: event.capacity || "Unlimited", icon: Hash, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Duration", value: getDuration(), icon: Timer, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Registration", value: event.registrationEnabled ? "Open" : "Closed", icon: CheckCircle2, color: event.registrationEnabled ? "text-green-400" : "text-red-400", bg: event.registrationEnabled ? "bg-green-500/10" : "bg-red-500/10" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="h-4 w-4" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Basic Information</CardTitle></CardHeader>
                <CardContent className="divide-y">
                  <InfoRow label="Title" value={event.title} />
                  <InfoRow label="Slug" value={<code className="text-xs bg-muted px-1 py-0.5 rounded">{event.slug}</code>} />
                  <InfoRow label="Festival" value={<button className="text-primary hover:underline" onClick={() => router.push(`/dashboard/admin/festivals/${event.festival?.id}`)}>{event.festival?.name}</button>} />
                  <InfoRow label="Category" value={event.category ? <span>{event.category.emoji} {event.category.name}</span> : "—"} />
                  <InfoRow label="Visibility" value={<Badge className={EVENT_VISIBILITY_COLORS[event.visibility]}>{EVENT_VISIBILITY_LABELS[event.visibility]}</Badge>} />
                  <InfoRow label="Featured" value={event.isFeatured ? "Yes" : "No"} />
                  {event.shortDescription && <InfoRow label="Description" value={event.shortDescription} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Schedule</CardTitle></CardHeader>
                <CardContent className="divide-y">
                  <InfoRow label="Start Date" value={fmt(event.startDate)} />
                  <InfoRow label="Start Time" value={fmtTime(event.startDate)} />
                  <InfoRow label="End Date" value={fmt(event.endDate)} />
                  <InfoRow label="End Time" value={fmtTime(event.endDate)} />
                  <InfoRow label="Duration" value={getDuration()} />
                  <InfoRow label="Timezone" value={getTZ(event.timezone)} />
                  {event.location && <InfoRow label="Location" value={<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Registration</CardTitle></CardHeader>
                <CardContent className="divide-y">
                  <InfoRow label="Registration" value={event.registrationEnabled ? "Enabled" : "Disabled"} />
                  <InfoRow label="Opens" value={fmtDT(event.registrationStart)} />
                  <InfoRow label="Closes" value={fmtDT(event.registrationEnd)} />
                  <InfoRow label="Capacity" value={event.capacity || "Unlimited"} />
                  <InfoRow label="Registered" value={event._count?.rsvps || 0} />
                  <InfoRow label="Waitlist" value={event.waitlistEnabled ? "Enabled" : "Disabled"} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Discord</CardTitle></CardHeader>
                <CardContent className="divide-y">
                  <InfoRow label="Voice Channel" value={event.discordVoiceChannelId ? <code className="text-xs bg-muted px-1 py-0.5 rounded">{event.discordVoiceChannelId}</code> : "Not set"} />
                  <InfoRow label="Stage Channel" value={event.discordStageChannelId ? <code className="text-xs bg-muted px-1 py-0.5 rounded">{event.discordStageChannelId}</code> : "Not set"} />
                </CardContent>
              </Card>
              {event.fullDescription && (
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>Full Description</CardTitle></CardHeader>
                  <CardContent><p className="text-sm whitespace-pre-wrap text-muted-foreground">{event.fullDescription}</p></CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Participants */}
          {activeTab === "participants" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Participants</CardTitle>
                <CardDescription>{event._count?.rsvps || 0} registered participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Participant Management</h3>
                  <p className="text-sm text-muted-foreground mt-1">Participant details are managed through the Registrations module.</p>
                  <Button className="mt-4" variant="outline" onClick={() => router.push("/dashboard/admin/registrations")}>
                    <ExternalLink className="mr-2 h-4 w-4" />View Registrations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registrations */}
          {activeTab === "registrations" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Registrations</CardTitle>
                <CardDescription>All registrations for this event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3 mb-6">
                  {[
                    { label: "Total Registered", value: event._count?.rsvps || 0, color: "text-blue-400" },
                    { label: "Max Capacity", value: event.capacity || "∞", color: "text-purple-400" },
                    { label: "Waitlist", value: event.waitlistEnabled ? "Active" : "Off", color: "text-amber-400" },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg border p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => router.push(`/dashboard/admin/registrations?eventId=${id}`)}>
                    <ExternalLink className="mr-2 h-4 w-4" />Manage Registrations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance */}
          {activeTab === "attendance" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Attendance</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Attendance Tracking</h3>
                  <p className="text-sm text-muted-foreground mt-1">Attendance records will appear here once the event goes live.</p>
                  {event.status !== "LIVE" && event.status !== "COMPLETED" && (
                    <Badge className="mt-4" variant="outline">Event must be Live or Completed</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Points */}
          {activeTab === "points" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" />Points</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Points & Scoring</h3>
                  <p className="text-sm text-muted-foreground mt-1">Points are awarded after the event is completed.</p>
                  <Button className="mt-4" variant="outline" onClick={() => router.push("/dashboard/admin/analytics")}>
                    <BarChart3 className="mr-2 h-4 w-4" />View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {activeTab === "results" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Results</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Event Results</h3>
                  <p className="text-sm text-muted-foreground mt-1">Results will be published after the event is completed.</p>
                  {event.status === "COMPLETED" && (
                    <Button className="mt-4" variant="outline" onClick={() => router.push("/dashboard/leaderboard")}>
                      <ExternalLink className="mr-2 h-4 w-4" />View Leaderboard
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media */}
          {activeTab === "media" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />Media</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {event.bannerUrl || event.thumbnailUrl ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {event.bannerUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Banner</p>
                        <div className="overflow-hidden rounded-lg border h-40">
                          <img src={event.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                        </div>
                        <p className="text-xs text-muted-foreground break-all">{event.bannerUrl}</p>
                      </div>
                    )}
                    {event.thumbnailUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Thumbnail</p>
                        <div className="overflow-hidden rounded-lg border h-40">
                          <img src={event.thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                        </div>
                        <p className="text-xs text-muted-foreground break-all">{event.thumbnailUrl}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Image className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No Media</h3>
                    <p className="text-sm text-muted-foreground mt-1">Add a banner or thumbnail by editing the event.</p>
                    <Button className="mt-4" variant="outline" onClick={() => router.push(`/dashboard/admin/events/${id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />Edit Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Announcements */}
          {activeTab === "announcements" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Announcements</CardTitle>
                <CardDescription>Event-related announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">No Announcements</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create announcements for this event from the Announcements module.</p>
                  <Button className="mt-4" variant="outline" onClick={() => router.push("/dashboard/admin/announcements/new")}>
                    <ExternalLink className="mr-2 h-4 w-4" />Create Announcement
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Event Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {timeline.map((item, i) => {
                    const isPast = item.date && new Date(item.date) <= new Date();
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${isPast ? `${item.color} border-transparent text-white` : "border-border bg-background text-muted-foreground"}`}>
                            {item.icon}
                          </div>
                          {i < timeline.length - 1 && <div className={`w-0.5 flex-1 my-1 ${isPast ? "bg-primary/30" : "bg-border"}`} style={{ minHeight: "2rem" }} />}
                        </div>
                        <div className="pb-6 pt-1.5">
                          <p className={`font-medium text-sm ${isPast ? "" : "text-muted-foreground"}`}>{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.date ? fmtDT(item.date) : "—"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Event Settings</CardTitle><CardDescription>Manage event configuration</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => router.push(`/dashboard/admin/events/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />Edit Event Details
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setDuplicateDialogOpen(true)}>
                    <Copy className="mr-2 h-4 w-4" />Duplicate Event
                  </Button>
                  {event.status !== "ARCHIVED" && (
                    <Button className="w-full justify-start" variant="outline" onClick={() => handleAction(() => archiveEvent(id))}>
                      <Archive className="mr-2 h-4 w-4" />Archive Event
                    </Button>
                  )}
                  {event.status === "ARCHIVED" && (
                    <Button className="w-full justify-start" variant="outline" onClick={() => handleAction(() => restoreEvent(id))}>
                      <RotateCcw className="mr-2 h-4 w-4" />Restore Event
                    </Button>
                  )}
                </CardContent>
              </Card>
              <Card className="border-destructive/30">
                <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle><CardDescription>Irreversible actions</CardDescription></CardHeader>
                <CardContent>
                  <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />Delete Event Permanently
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dialogs */}
      <DeleteEventDialog eventTitle={event.title} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}
        onConfirm={() => startTransition(async () => { const r = await deleteEvent(id); if (r.success) { setDeleteDialogOpen(false); router.push("/dashboard/admin/events"); } })}
        isPending={isPending} />
      <PublishEventDialog eventTitle={event.title} isPublished={event.status === "PUBLISHED"} open={publishDialogOpen} onOpenChange={setPublishDialogOpen}
        onConfirm={() => handleAction(() => event.status === "PUBLISHED" ? unpublishEvent(id) : publishEvent(id))}
        isPending={isPending} />
      <DuplicateEventDialog event={event as any} open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen} />
    </div>
  );
}

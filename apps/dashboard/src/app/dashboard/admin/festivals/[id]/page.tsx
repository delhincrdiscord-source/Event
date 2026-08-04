"use client";

import { useState, useEffect, useCallback, use, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Settings, Trash2, Archive, RotateCcw, CheckCircle2, XCircle, Globe, Lock, EyeOff, Users, Zap, Trophy, Megaphone, Image, BarChart3, Star, Pencil, Copy, Play, Pause, ExternalLink,  } from "lucide-react";

import { Button } from "@gameverse/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import { Separator } from "@gameverse/ui/separator";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  getFestivalById,
  deleteFestival,
  archiveFestival,
  restoreFestival,
  updateFestival,
} from "../_actions/festival";
import {
  ArchiveFestivalDialog,
  DeleteFestivalDialog,
  DuplicateFestivalDialog,
  RestoreFestivalDialog,
} from "../_components";
import type { Festival, FestivalStatus } from "@gameverse/types";

// =====================================================
// Status config
// =====================================================

const STATUS_CONFIG: Record<FestivalStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  DRAFT: { label: "Draft", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", dot: "bg-slate-400" },
  UPCOMING: { label: "Upcoming", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400" },
  LIVE: { label: "Active", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", dot: "bg-green-400 animate-pulse" },
  COMPLETED: { label: "Completed", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-400" },
  ARCHIVED: { label: "Archived", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-400" },
};

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
  PUBLIC: <Globe className="h-3.5 w-3.5" />,
  PRIVATE: <Lock className="h-3.5 w-3.5" />,
  UNLISTED: <EyeOff className="h-3.5 w-3.5" />,
};

// =====================================================
// Tab definitions
// =====================================================

const TABS = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "statistics", label: "Statistics", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "events", label: "Events", icon: <Zap className="h-4 w-4" /> },
  { id: "participants", label: "Participants", icon: <Users className="h-4 w-4" /> },
  { id: "announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { id: "gallery", label: "Gallery", icon: <Image className="h-4 w-4" /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
  { id: "hall-of-fame", label: "Hall of Fame", icon: <Star className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

// =====================================================
// Stat mini card
// =====================================================

function MiniStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

// =====================================================
// Tab Content Components
// =====================================================

function OverviewTab({ festival }: { festival: Festival }) {
  const formatDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const formatDateTime = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const startDate = new Date(festival.startDate);
  const endDate = new Date(festival.endDate);
  const now = new Date();
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  return (
    <div className="space-y-5">
      {/* Description */}
      {festival.shortDescription && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{festival.shortDescription}</p>
          </CardContent>
        </Card>
      )}

      {/* Festival Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Festival Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Day {Math.min(elapsedDays, totalDays)} of {totalDays}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: festival.themeColor }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatDate(festival.startDate)}</span>
            <span>{formatDate(festival.endDate)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{formatDate(festival.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">{formatDate(festival.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timezone</span>
              <span className="font-medium">{festival.timezone}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium ${festival.registrationEnabled ? "text-green-400" : "text-muted-foreground"}`}>
                {festival.registrationEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            {festival.registrationStart && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opens</span>
                <span className="font-medium">{formatDateTime(festival.registrationStart)}</span>
              </div>
            )}
            {festival.registrationEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closes</span>
                <span className="font-medium">{formatDateTime(festival.registrationEnd)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Description */}
      {festival.fullDescription && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Full Description / Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{festival.fullDescription}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
        <Zap className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
  );
}

// =====================================================
// Main Page
// =====================================================

export default function FestivalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [isPending, startTransition] = useTransition();
  const [festival, setFestival] = useState<Festival | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const fetchFestival = useCallback(async () => {
    const result = await getFestivalById(id);
    if (result.success && result.data) setFestival(result.data);
    setIsLoading(false);
  }, [id]);

  useEffect(() => { fetchFestival(); }, [fetchFestival]);

  const handleArchive = async () => {
    startTransition(async () => {
      await archiveFestival(id);
      setArchiveOpen(false);
      fetchFestival();
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteFestival(id);
      if (result.success) router.push("/dashboard/admin/festivals");
    });
  };

  const handleRestore = async () => {
    startTransition(async () => {
      await restoreFestival(id);
      setRestoreOpen(false);
      fetchFestival();
    });
  };

  const handlePause = async () => {
    startTransition(async () => {
      await updateFestival(id, { status: "UPCOMING" });
      fetchFestival();
    });
  };

  const handleResume = async () => {
    startTransition(async () => {
      await updateFestival(id, { status: "LIVE" });
      fetchFestival();
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Festival not found</h3>
        <p className="text-sm text-muted-foreground mt-1">This festival may have been deleted.</p>
        <Button className="mt-5" onClick={() => router.push("/dashboard/admin/festivals")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Festivals
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[festival.status];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border/50">
        <div
          className="h-40 w-full"
          style={{
            background: festival.bannerUrl
              ? `url(${festival.bannerUrl}) center/cover`
              : `linear-gradient(135deg, ${festival.themeColor}44 0%, ${festival.themeColor}11 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Logo */}
              <div className="h-14 w-14 rounded-xl border-2 border-background bg-card overflow-hidden shadow-lg shrink-0">
                {festival.logoUrl ? (
                  <img src={festival.logoUrl} alt={`${festival.name} logo`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white text-xl font-bold" style={{ background: festival.themeColor }}>
                    {festival.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{festival.name}</h1>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {VISIBILITY_ICONS[festival.visibility]}
                    {festival.visibility}
                  </span>
                  <span>/{festival.slug}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/admin/festivals/${festival.id}/edit`)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setDuplicateOpen(true)}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
              </Button>
              {festival.status === "LIVE" && (
                <Button variant="secondary" size="sm" onClick={handlePause} disabled={isPending}>
                  <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
                </Button>
              )}
              {festival.status === "UPCOMING" && (
                <Button variant="secondary" size="sm" onClick={handleResume} disabled={isPending}>
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
                </Button>
              )}
              {(festival.status === "DRAFT" || festival.status === "UPCOMING") && (
                <Button variant="secondary" size="sm" onClick={() => setArchiveOpen(true)}>
                  <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
                </Button>
              )}
              {festival.status === "ARCHIVED" && (
                <Button variant="secondary" size="sm" onClick={() => setRestoreOpen(true)}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" className="bg-background/70 backdrop-blur-sm" onClick={() => router.push("/dashboard/admin/festivals")}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Festivals
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Events" value={(festival as any)._count?.events ?? 0} icon={<Zap className="h-3 w-3" />} />
        <MiniStat label="Participants" value={(festival as any)._count?.registrations ?? 0} icon={<Users className="h-3 w-3" />} />
        <MiniStat label="Duration" value={`${Math.ceil((new Date(festival.endDate).getTime() - new Date(festival.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`} icon={<Clock className="h-3 w-3" />} />
        <MiniStat label="Visibility" value={festival.visibility} icon={VISIBILITY_ICONS[festival.visibility]} />
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-1 overflow-x-auto border-b border-border/50 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "overview" && <OverviewTab festival={festival} />}
          {activeTab === "statistics" && <PlaceholderTab title="Statistics" description="Festival statistics and analytics will appear here." />}
          {activeTab === "events" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => router.push(`/dashboard/admin/events?festival=${festival.id}`)}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Manage Events
                </Button>
              </div>
              <PlaceholderTab title="Events" description="Events for this festival will appear here." />
            </div>
          )}
          {activeTab === "participants" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => router.push(`/dashboard/admin/registrations?festival=${festival.id}`)}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Manage Registrations
                </Button>
              </div>
              <PlaceholderTab title="Participants" description="Registered participants will appear here." />
            </div>
          )}
          {activeTab === "announcements" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => router.push(`/dashboard/admin/announcements?festival=${festival.id}`)}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Manage Announcements
                </Button>
              </div>
              <PlaceholderTab title="Announcements" description="Festival announcements will appear here." />
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => router.push(`/dashboard/admin/gallery?festival=${festival.id}`)}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Manage Gallery
                </Button>
              </div>
              <PlaceholderTab title="Gallery" description="Festival gallery items will appear here." />
            </div>
          )}
          {activeTab === "leaderboard" && <PlaceholderTab title="Leaderboard" description="Festival leaderboard will appear here." />}
          {activeTab === "hall-of-fame" && <PlaceholderTab title="Hall of Fame" description="Festival Hall of Fame entries will appear here." />}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Festival Settings</CardTitle>
                  <CardDescription>Manage festival configuration and status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Festival Status</p>
                      <p className="text-xs text-muted-foreground">Current: {statusConfig.label}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/festivals/${festival.id}/edit`)}>
                      Change Status
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Active Status</p>
                      <p className="text-xs text-muted-foreground">{festival.isActive ? "Festival is active" : "Festival is inactive"}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        startTransition(async () => {
                          await updateFestival(id, { isActive: !festival.isActive });
                          fetchFestival();
                        });
                      }}
                      disabled={isPending}
                    >
                      {festival.isActive ? <><XCircle className="mr-1.5 h-3.5 w-3.5" /> Deactivate</> : <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Activate</>}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-destructive">Delete Festival</p>
                      <p className="text-xs text-muted-foreground">Soft delete — can be restored later.</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ArchiveFestivalDialog
        festivalName={festival.name}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onConfirm={handleArchive}
        isPending={isPending}
      />
      <DeleteFestivalDialog
        festivalName={festival.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
      <DuplicateFestivalDialog
        festival={festival}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />
      <RestoreFestivalDialog
        festivalName={festival.name}
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        onConfirm={handleRestore}
        isPending={isPending}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users, Shield, ShieldOff, Ban, TrendingUp, TrendingDown, Trophy, Activity, Calendar, MessageCircle, Award, Zap, CheckCircle2, Edit, Trash2, Plus, Medal, BarChart3, StickyNote,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@gameverse/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@gameverse/ui/avatar";
import { Skeleton } from "@gameverse/ui/skeleton";

import { Textarea } from "@gameverse/ui/textarea";

import { getParticipantById, getParticipantNotes, addParticipantNote, updateParticipantNote, deleteParticipantNote, awardBonusPoints, deductPoints, suspendParticipant, unsuspendParticipant, blacklistParticipant, type ParticipantNote,  } from "../_actions/participant";

// =====================================================
// Types
// =====================================================

interface ParticipantDetail {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  email: string;
  bio: string | null;
  bannedAt: Date | null;
  banReason: string | null;
  createdAt: Date;
  discordAccount: {
    discordUserId: string;
    username: string | null;
    discriminator: string | null;
    avatarUrl: string | null;
    status: string;
  } | null;
  registrations: {
    id: string;
    status: string;
    passNumber: string;
    registeredAt: Date;
    festival: { id: string; name: string; slug: string } | null;
    event: { id: string; title: string; slug: string; startDate: Date; endDate: Date } | null;
  }[];
  userPoints: { id: string; points: number; source: string; reason: string | null; createdAt: Date }[];
  userAchievements: {
    id: string;
    unlockedAt: Date;
    achievement: { id: string; name: string; description: string | null; icon: string; category: string; pointValue: number };
  }[];
  userBadges: {
    id: string;
    earnedAt: Date;
    badge: { id: string; name: string; description: string | null; icon: string; tier: string; pointValue: number };
  }[];
  userRewards: {
    id: string;
    redeemedAt: Date;
    reward: { id: string; name: string; description: string | null; icon: string; pointCost: number };
  }[];
}

// =====================================================
// Helpers
// =====================================================

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const TABS = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "registrations", label: "Registrations", icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: "points", label: "Points History", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "achievements", label: "Achievements", icon: <Trophy className="h-3.5 w-3.5" /> },
  { id: "badges", label: "Badges", icon: <Medal className="h-3.5 w-3.5" /> },
  { id: "activity", label: "Activity", icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "notes", label: "Staff Notes", icon: <StickyNote className="h-3.5 w-3.5" /> },
];

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  SUSPENDED: { label: "Suspended", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
  BLACKLISTED: { label: "Blacklisted", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" },
};

const REG_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10" },
  APPROVED: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10" },
  WAITLISTED: { label: "Waitlisted", color: "text-blue-400", bg: "bg-blue-500/10" },
  CANCELLED: { label: "Cancelled", color: "text-gray-400", bg: "bg-gray-500/10" },
  CHECKED_IN: { label: "Checked In", color: "text-purple-400", bg: "bg-purple-500/10" },
  COMPLETED: { label: "Completed", color: "text-teal-400", bg: "bg-teal-500/10" },
};

// =====================================================
// Points Modal
// =====================================================

interface PointsModalProps {
  open: boolean;
  onClose: () => void;
  mode: "award" | "deduct";
  onConfirm: (points: number, reason: string) => void;
  loading?: boolean;
}

function PointsModal({ open, onClose, mode, onConfirm, loading }: PointsModalProps) {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-2">{mode === "award" ? "Award Bonus Points" : "Deduct Points"}</h3>
        <p className="text-sm text-muted-foreground mb-4">{mode === "award" ? "Award bonus points to this participant." : "Deduct points from this participant."}</p>
        <div className="space-y-3 mb-4">
          <input type="number" placeholder="Points amount" value={points} onChange={(e) => setPoints(e.target.value)} min={1}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea rows={2} placeholder="Reason..." value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <button className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${mode === "award" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
            onClick={() => onConfirm(Number(points), reason)} disabled={loading || !points || !reason.trim() || Number(points) <= 0}>
            {loading ? "Processing..." : mode === "award" ? "Award" : "Deduct"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// Action Modal
// =====================================================

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  requireReason?: boolean;
  placeholder?: string;
  onConfirm: (reason: string) => void;
  loading?: boolean;
  variant?: "danger" | "warning" | "default";
}

function ActionModal({ open, onClose, title, description, requireReason, placeholder, onConfirm, loading, variant = "default" }: ActionModalProps) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  const btnClass = variant === "danger" ? "bg-red-600 hover:bg-red-700 text-white" : variant === "warning" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {requireReason && (
          <textarea rows={3} placeholder={placeholder ?? "Enter reason..."} value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-4" />
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <button className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${btnClass}`}
            onClick={() => onConfirm(reason)} disabled={loading || (requireReason && !reason.trim())}>
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// Staff Notes Tab
// =====================================================

interface StaffNotesTabProps {
  userId: string;
  notes: ParticipantNote[];
  onRefresh: () => void;
}

function StaffNotesTab({ userId, notes, onRefresh }: StaffNotesTabProps) {
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      await addParticipantNote(userId, newNote.trim());
      setNewNote("");
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await updateParticipantNote(noteId, editContent.trim());
      setEditingId(null);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setLoading(true);
    try {
      await deleteParticipantNote(noteId);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Add Staff Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Write a private staff note about this participant..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" /> Private — only visible to staff
            </p>
            <Button size="sm" onClick={handleAdd} disabled={loading || !newNote.trim()}>
              {loading ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No staff notes yet</p>
          <p className="text-xs mt-1">Add the first note above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => handleUpdate(note.id)} disabled={loading}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={note.author.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">{getInitials(note.author.username)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{note.author.username}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Private</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(note.id); setEditContent(note.content); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-400" onClick={() => handleDelete(note.id)} disabled={loading}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Main Profile Page
// =====================================================

export default function ParticipantProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [participant, setParticipant] = useState<ParticipantDetail | null>(null);
  const [notes, setNotes] = useState<ParticipantNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);

  const [pointsModal, setPointsModal] = useState<{ open: boolean; mode: "award" | "deduct" }>({ open: false, mode: "award" });
  const [actionModal, setActionModal] = useState<{
    open: boolean; type: "suspend" | "unsuspend" | "blacklist" | null;
    title: string; description: string; variant: "danger" | "warning" | "default";
  }>({ open: false, type: null, title: "", description: "", variant: "default" });

  const fetchParticipant = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getParticipantById(userId);
      if (result.success && result.data) setParticipant(result.data as ParticipantDetail);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchNotes = useCallback(async () => {
    const result = await getParticipantNotes(userId);
    if (result.success && result.data) setNotes(result.data);
  }, [userId]);

  useEffect(() => {
    fetchParticipant();
    fetchNotes();
  }, [fetchParticipant, fetchNotes]);

  const participantStatus: "ACTIVE" | "SUSPENDED" | "BLACKLISTED" = participant ? participant.banReason?.startsWith("BLACKLISTED") ? "BLACKLISTED" : participant.bannedAt ? "SUSPENDED" : "ACTIVE"
    : "ACTIVE";

  const totalPoints = participant?.userPoints.reduce((s, p) => s + p.points, 0) ?? 0;
  const approvedRegistrations = participant?.registrations.filter((r) => ["APPROVED", "CHECKED_IN", "COMPLETED"].includes(r.status)).length ?? 0;

  const handleActionConfirm = async (reason: string) => {
    if (!actionModal.type) return;
    setActionLoading(true);
    try {
      if (actionModal.type === "suspend") await suspendParticipant(userId, reason);
      else if (actionModal.type === "unsuspend") await unsuspendParticipant(userId);
      else if (actionModal.type === "blacklist") await blacklistParticipant(userId, reason);
      setActionModal({ open: false, type: null, title: "", description: "", variant: "default" });
      fetchParticipant();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePointsConfirm = async (pts: number, reason: string) => {
    setActionLoading(true);
    try {
      if (pointsModal.mode === "award") await awardBonusPoints(userId, pts, reason);
      else await deductPoints(userId, pts, reason);
      setPointsModal({ open: false, mode: "award" });
      fetchParticipant();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Users className="h-12 w-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Participant not found</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[participantStatus];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Participants
      </Button>

      {/* Hero */}
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-violet-500/10 to-pink-500/10" />
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <Avatar className="h-20 w-20 border-4 border-card ring-2 ring-primary/20">
              <AvatarImage src={participant.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xl bg-primary/20 text-primary">
                {getInitials(participant.globalName ?? participant.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{participant.globalName ?? participant.username}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">@{participant.username}</p>
              {participant.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{participant.bio}</p>}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setPointsModal({ open: true, mode: "award" })}>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Award Points
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setPointsModal({ open: true, mode: "deduct" })}>
                <TrendingDown className="h-3.5 w-3.5 text-red-400" /> Deduct Points
              </Button>
              {participantStatus === "ACTIVE" ? (
                <Button size="sm" variant="outline" className="gap-2 text-amber-400 border-amber-400/30 hover:bg-amber-500/10"
                  onClick={() => setActionModal({ open: true, type: "suspend", title: "Suspend Participant", description: "Suspend this participant?", variant: "warning" })}>
                  <Shield className="h-3.5 w-3.5" /> Suspend
                </Button>
              ) : participantStatus === "SUSPENDED" ? (
                <Button size="sm" variant="outline" className="gap-2 text-emerald-400 border-emerald-400/30 hover:bg-emerald-500/10"
                  onClick={() => setActionModal({ open: true, type: "unsuspend", title: "Unsuspend Participant", description: "Restore access for this participant?", variant: "default" })}>
                  <ShieldOff className="h-3.5 w-3.5" /> Unsuspend
                </Button>
              ) : null}
              <Button size="sm" variant="outline" className="gap-2 text-red-400 border-red-400/30 hover:bg-red-500/10"
                onClick={() => setActionModal({ open: true, type: "blacklist", title: "Blacklist Participant", description: "Permanently blacklist this participant?", variant: "danger" })}>
                <Ban className="h-3.5 w-3.5" /> Blacklist
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="text-xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Events Joined</p>
              <p className="text-xl font-bold text-foreground">{participant.registrations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attended</p>
              <p className="text-xl font-bold text-foreground">{approvedRegistrations}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Achievements</p>
              <p className="text-xl font-bold text-foreground">{participant.userAchievements.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary/10 text-primary border-b-2 border-primary" :"text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Profile Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Username</span>
                    <span className="font-medium">@{participant.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Display Name</span>
                    <span className="font-medium">{participant.globalName ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{participant.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-medium">{formatDate(participant.createdAt)}</span>
                  </div>
                  {participant.bannedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Suspended At</span>
                      <span className="font-medium text-amber-400">{formatDate(participant.bannedAt)}</span>
                    </div>
                  )}
                  {participant.banReason && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reason</span>
                      <span className="font-medium text-red-400 max-w-[200px] text-right">{participant.banReason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><MessageCircle className="h-4 w-4 text-indigo-400" /> Discord Account</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {participant.discordAccount ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Username</span>
                        <span className="font-medium">{participant.discordAccount.username ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discord ID</span>
                        <span className="font-mono text-xs">{participant.discordAccount.discordUserId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-emerald-400 font-medium">{participant.discordAccount.status}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No Discord account linked</p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Festival Participation</CardTitle></CardHeader>
                <CardContent>
                  {participant.registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No festival participation yet</p>
                  ) : (
                    <div className="space-y-2">
                      {[...new Set(participant.registrations.map((r) => r.festival?.name).filter(Boolean))].map((name) => (
                        <div key={name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                          <span className="font-medium">{name}</span>
                          <span className="text-xs text-muted-foreground">
                            {participant.registrations.filter((r) => r.festival?.name === name).length} events
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Recent Badges</CardTitle></CardHeader>
                <CardContent>
                  {participant.userBadges.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No badges earned yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {participant.userBadges.slice(0, 6).map((ub) => (
                        <div key={ub.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/50">
                          <span className="text-base">{ub.badge.icon}</span>
                          <span className="text-xs font-medium">{ub.badge.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Registrations */}
          {activeTab === "registrations" && (
            <Card className="border-border/50 bg-card/50 overflow-hidden">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Registration History ({participant.registrations.length})</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Festival</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pass</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participant.registrations.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No registrations found</td></tr>
                    ) : participant.registrations.map((reg) => {
                      const sc = REG_STATUS_CONFIG[reg.status] ?? { label: reg.status, color: "text-muted-foreground", bg: "bg-muted/50" };
                      return (
                        <tr key={reg.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{reg.event?.title ?? "Festival Registration"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{reg.festival?.name ?? "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs">{reg.passNumber}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(reg.registeredAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Points History */}
          {activeTab === "points" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{totalPoints.toLocaleString()} pts</span></p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setPointsModal({ open: true, mode: "award" })}>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Award
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => setPointsModal({ open: true, mode: "deduct" })}>
                    <TrendingDown className="h-3.5 w-3.5 text-red-400" /> Deduct
                  </Button>
                </div>
              </div>
              <Card className="border-border/50 bg-card/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Points</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participant.userPoints.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No points history</td></tr>
                      ) : participant.userPoints.map((p) => (
                        <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`font-bold ${p.points >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {p.points >= 0 ? "+" : ""}{p.points}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{p.source}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{p.reason ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Achievements */}
          {activeTab === "achievements" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participant.userAchievements.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No achievements unlocked yet</p>
                </div>
              ) : participant.userAchievements.map((ua) => (
                <Card key={ua.id} className="border-border/50 bg-card/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl shrink-0">
                      {ua.achievement.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{ua.achievement.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ua.achievement.description ?? ""}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-yellow-400 font-medium">+{ua.achievement.pointValue} pts</span>
                        <span className="text-xs text-muted-foreground">{formatDate(ua.unlockedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Badges */}
          {activeTab === "badges" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participant.userBadges.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Medal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No badges earned yet</p>
                </div>
              ) : participant.userBadges.map((ub) => (
                <Card key={ub.id} className="border-border/50 bg-card/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl shrink-0">
                      {ub.badge.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{ub.badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ub.badge.description ?? ""}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{ub.badge.tier}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(ub.earnedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Activity */}
          {activeTab === "activity" && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="relative space-y-4">
                  {[
                    ...participant.registrations.map((r) => ({
                      id: r.id,
                      type: "registration" as const,
                      title: `Registered for ${r.event?.title ?? r.festival?.name ?? "event"}`,
                      date: r.registeredAt,
                      icon: <Calendar className="h-3.5 w-3.5 text-blue-400" />,
                      color: "bg-blue-500/10 border-blue-500/20",
                    })),
                    ...participant.userAchievements.map((ua) => ({
                      id: ua.id,
                      type: "achievement" as const,
                      title: `Unlocked achievement: ${ua.achievement.name}`,
                      date: ua.unlockedAt,
                      icon: <Trophy className="h-3.5 w-3.5 text-yellow-400" />,
                      color: "bg-yellow-500/10 border-yellow-500/20",
                    })),
                    ...participant.userBadges.map((ub) => ({
                      id: ub.id,
                      type: "badge" as const,
                      title: `Earned badge: ${ub.badge.name}`,
                      date: ub.earnedAt,
                      icon: <Medal className="h-3.5 w-3.5 text-purple-400" />,
                      color: "bg-purple-500/10 border-purple-500/20",
                    })),
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 30)
                    .map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 ${item.color}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(item.date)}</p>
                        </div>
                      </div>
                    ))}
                  {participant.registrations.length === 0 && participant.userAchievements.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Notes */}
          {activeTab === "notes" && (
            <StaffNotesTab userId={userId} notes={notes} onRefresh={fetchNotes} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <PointsModal
        open={pointsModal.open}
        onClose={() => setPointsModal({ open: false, mode: "award" })}
        mode={pointsModal.mode}
        onConfirm={handlePointsConfirm}
        loading={actionLoading}
      />
      <ActionModal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, type: null, title: "", description: "", variant: "default" })}
        title={actionModal.title}
        description={actionModal.description}
        requireReason={actionModal.type === "suspend" || actionModal.type === "blacklist"}
        placeholder={actionModal.type === "blacklist" ? "Reason for blacklisting..." : "Reason for suspension..."}
        onConfirm={handleActionConfirm}
        loading={actionLoading}
        variant={actionModal.variant}
      />
    </div>
  );
}

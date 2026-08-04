"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, LogIn, LogOut, WifiOff, Users, Calendar, StickyNote, Send, Activity, User, Hash, CheckSquare,  } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@gameverse/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@gameverse/ui/card";
import { Skeleton } from "@gameverse/ui/skeleton";
import { Textarea } from "@gameverse/ui/textarea";
import { Separator } from "@gameverse/ui/separator";

import {
  getAttendanceById,
  checkInParticipant,
  checkOutParticipant,
  updateAttendanceStatus,
  addAttendanceNote,
  type AttendanceStatus,
} from "../_actions/attendance";

// =====================================================
// Helpers
// =====================================================

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type AttendanceStatusType = AttendanceStatus;

const STATUS_CONFIG: Record<
  AttendanceStatusType,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  PRESENT: {
    label: "Present",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  LATE: {
    label: "Late",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: <Clock className="h-4 w-4" />,
  },
  ABSENT: {
    label: "Absent",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: <XCircle className="h-4 w-4" />,
  },
  EXCUSED: {
    label: "Excused",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  LEFT_EARLY: {
    label: "Left Early",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: <LogOut className="h-4 w-4" />,
  },
  DISCONNECTED: {
    label: "Disconnected",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: <WifiOff className="h-4 w-4" />,
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    icon: <Clock className="h-4 w-4" />,
  },
};

function deriveStatus(reg: {
  status: string;
  checkedInAt: Date | null;
  checkedInBy: string | null;
  cancelReason: string | null;
  notes: string | null;
}): AttendanceStatusType {
  if (reg.status === "CANCELLED") {
    if (reg.cancelReason?.includes("EXCUSED")) return "EXCUSED";
    return "ABSENT";
  }
  if (reg.notes?.includes("LEFT_EARLY")) return "LEFT_EARLY";
  if (reg.notes?.includes("DISCONNECTED")) return "DISCONNECTED";
  if (reg.notes?.includes("LATE")) return "LATE";
  if (reg.status === "CHECKED_IN" || reg.status === "COMPLETED") {
    return reg.checkedInAt ? "PRESENT" : "PENDING_VERIFICATION";
  }
  if (reg.status === "APPROVED") return "PENDING_VERIFICATION";
  return "ABSENT";
}

// =====================================================
// Timeline Item
// =====================================================

function TimelineItem({
  icon,
  title,
  description,
  time,
  color = "bg-muted",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  time: string;
  color?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}
        >
          {icon}
        </div>
        <div className="mt-1 w-px flex-1 bg-border" />
      </div>
      <div className="pb-4 pt-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

// =====================================================
// Main Detail Page
// =====================================================

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const id = params.id as string;

  const fetchRecord = async () => {
    setIsLoading(true);
    try {
      const result = await getAttendanceById(id);
      if (result.success && result.data) {
        setRecord(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const handleCheckIn = () => {
    startTransition(async () => {
      await checkInParticipant(id);
      fetchRecord();
    });
  };

  const handleCheckOut = () => {
    startTransition(async () => {
      await checkOutParticipant(id);
      fetchRecord();
    });
  };

  const handleStatusUpdate = (status: AttendanceStatusType) => {
    startTransition(async () => {
      await updateAttendanceStatus(id, status);
      fetchRecord();
    });
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setIsAddingNote(true);
    try {
      await addAttendanceNote(id, noteContent.trim());
      setNoteContent("");
      fetchRecord();
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <CheckSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Attendance record not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/admin/attendance")}
        >
          Back to Attendance
        </Button>
      </div>
    );
  }

  const attendanceStatus = deriveStatus({
    status: record.status,
    checkedInAt: record.checkedInAt,
    checkedInBy: record.checkedInBy,
    cancelReason: record.cancelReason,
    notes: record.notes,
  });

  const statusCfg = STATUS_CONFIG[attendanceStatus];

  const checkIn = record.checkedInAt ? new Date(record.checkedInAt) : null;
  const checkOut = record.event?.endDate ? new Date(record.event.endDate) : null;
  const durationMinutes =
    checkIn && checkOut
      ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000)
      : null;

  const timelineItems = [
    {
      action: "Registered",
      time: record.registeredAt,
      icon: <User className="h-4 w-4" />,
      color: "bg-primary/20 text-primary",
    },
    record.approvedAt && {
      action: "Approved",
      time: record.approvedAt,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "bg-emerald-500/20 text-emerald-400",
    },
    record.checkedInAt && {
      action: "Checked In",
      time: record.checkedInAt,
      icon: <LogIn className="h-4 w-4" />,
      color: "bg-blue-500/20 text-blue-400",
    },
    record.status === "COMPLETED" && {
      action: "Checked Out",
      time: record.updatedAt,
      icon: <LogOut className="h-4 w-4" />,
      color: "bg-amber-500/20 text-amber-400",
    },
    record.rejectedAt && {
      action: "Rejected",
      time: record.rejectedAt,
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-red-500/20 text-red-400",
    },
  ].filter(Boolean) as {
    action: string;
    time: Date;
    icon: React.ReactNode;
    color: string;
  }[];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/admin/attendance")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Attendance Detail
          </h1>
          <p className="text-sm text-muted-foreground">
            Pass #{record.passNumber}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Participant Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Participant Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 shrink-0">
                    <AvatarImage src={record.user?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-lg">
                      {getInitials(record.user?.globalName ?? record.user?.username ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Display Name</p>
                      <p className="text-sm font-medium">
                        {record.user?.globalName ?? record.user?.username ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="text-sm font-medium">@{record.user?.username ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{record.user?.email ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Discord Username</p>
                      <p className="text-sm font-medium">
                        {record.discordUsername ??
                          record.user?.discordAccount?.username ??
                          "—"}
                      </p>
                    </div>
                    {record.user?.discordAccount?.discordUserId && (
                      <div>
                        <p className="text-xs text-muted-foreground">Discord ID</p>
                        <p className="text-sm font-mono text-xs">
                          {record.user.discordAccount.discordUserId}
                        </p>
                      </div>
                    )}
                    {record.user?.bio && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Bio</p>
                        <p className="text-sm">{record.user.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/admin/participants/${record.userId}`)
                    }
                  >
                    <Users className="mr-2 h-3.5 w-3.5" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Event Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Festival</p>
                    <p className="text-sm font-medium">{record.festival?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Event</p>
                    <p className="text-sm font-medium">{record.event?.title ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Event Start</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(record.event?.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Event End</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(record.event?.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Event Status</p>
                    <p className="text-sm font-medium capitalize">
                      {record.event?.status?.toLowerCase() ?? "—"}
                    </p>
                  </div>
                  {record.event?.discordVoiceChannelId && (
                    <div>
                      <p className="text-xs text-muted-foreground">Voice Channel</p>
                      <p className="text-sm font-mono text-xs">
                        {record.event.discordVoiceChannelId}
                      </p>
                    </div>
                  )}
                </div>
                {record.event?.id && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/admin/events/${record.event.id}`)
                      }
                    >
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      View Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Attendance Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Attendance Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {timelineItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No timeline events yet
                    </p>
                  ) : (
                    timelineItems.map((item, i) => (
                      <TimelineItem
                        key={i}
                        icon={item.icon}
                        title={item.action}
                        time={formatDateTime(item.time)}
                        color={item.color}
                      />
                    ))
                  )}
                </div>

                {/* Duration Summary */}
                <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <p className="text-sm font-semibold">
                      {checkIn
                        ? checkIn.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <p className="text-sm font-semibold">
                      {checkOut
                        ? checkOut.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-semibold">{formatDuration(durationMinutes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staff Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-primary" />
                  Staff Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Note */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add an internal staff note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || isAddingNote}
                    className="gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isAddingNote ? "Adding..." : "Add Note"}
                  </Button>
                </div>

                <Separator />

                {/* Notes List */}
                <div className="space-y-3">
                  {(!record.notesList || record.notesList.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No staff notes yet
                    </p>
                  ) : (
                    record.notesList.map((note: any) => (
                      <div
                        key={note.id}
                        className="rounded-lg border bg-muted/20 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={note.author?.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(note.author?.username ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {note.author?.username ?? "Staff"}
                          </span>
                          {note.isInternal && (
                            <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                              Internal
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTime(note.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={handleCheckIn}
                  disabled={isPending || attendanceStatus === "PRESENT"}
                >
                  <LogIn className="h-4 w-4 text-emerald-500" />
                  Check In
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={handleCheckOut}
                  disabled={isPending || attendanceStatus !== "PRESENT"}
                >
                  <LogOut className="h-4 w-4 text-amber-500" />
                  Check Out
                </Button>
                <Separator />
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("PRESENT")}
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Mark Present
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("LATE")}
                  disabled={isPending}
                >
                  <Clock className="h-4 w-4 text-amber-500" />
                  Mark Late
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("ABSENT")}
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                  Mark Absent
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("EXCUSED")}
                  disabled={isPending}
                >
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Mark Excused
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("LEFT_EARLY")}
                  disabled={isPending}
                >
                  <LogOut className="h-4 w-4 text-orange-500" />
                  Mark Left Early
                </Button>
                <Button
                  className="w-full gap-2 justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("DISCONNECTED")}
                  disabled={isPending}
                >
                  <WifiOff className="h-4 w-4 text-purple-500" />
                  Mark Disconnected
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Registration Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Registration Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pass Number</p>
                  <p className="text-sm font-mono font-medium">{record.passNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registered At</p>
                  <p className="text-sm font-medium">{formatDateTime(record.registeredAt)}</p>
                </div>
                {record.approvedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Approved At</p>
                    <p className="text-sm font-medium">{formatDateTime(record.approvedAt)}</p>
                  </div>
                )}
                {record.checkedInAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Checked In At</p>
                    <p className="text-sm font-medium">{formatDateTime(record.checkedInAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Registration Status</p>
                  <p className="text-sm font-medium capitalize">
                    {record.status?.toLowerCase().replace("_", " ") ?? "—"}
                  </p>
                </div>
                {record.interest && (
                  <div>
                    <p className="text-xs text-muted-foreground">Interest</p>
                    <p className="text-sm font-medium">{record.interest}</p>
                  </div>
                )}
                {record.cancelReason && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cancel Reason</p>
                    <p className="text-sm font-medium">{record.cancelReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Verification History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Verification History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {record.timeline && record.timeline.length > 0 ? (
                    record.timeline.map((t: any) => (
                      <div key={t.id} className="flex items-start gap-2">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{t.action}</p>
                          {t.actorName && (
                            <p className="text-[10px] text-muted-foreground">
                              by {t.actorName}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateTime(t.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No verification history
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

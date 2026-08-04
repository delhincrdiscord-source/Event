"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, FileText, Calendar, MapPin, QrCode, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Clock, UserCheck, Loader2, Trash2, CalendarDays, CreditCard, MessageSquare, Hash, Activity, ExternalLink, Copy, CheckCheck, Gamepad2, Flag,  } from "lucide-react";
import { motion } from "framer-motion";

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
import { Avatar, AvatarFallback, AvatarImage } from "@gameverse/ui/avatar";

import {
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  waitlistRegistration,
  cancelRegistration,
  checkInRegistration,
  deleteRegistration,
} from "../_actions/registration";
import { RegistrationTimeline } from "../_components/timeline";
import { RegistrationNotes } from "../_components/notes";
import type { RegistrationWithRelations } from "@gameverse/types";
import { REGISTRATION_STATUS_LABELS,  } from "@gameverse/types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  APPROVED: <CheckCircle2 className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
  WAITLISTED: <AlertTriangle className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
  CHECKED_IN: <UserCheck className="h-4 w-4" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
  WAITLISTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
  CHECKED_IN: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  COMPLETED: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function RegistrationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [registration, setRegistration] = useState<RegistrationWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchRegistration = useCallback(async () => {
    setIsLoading(true);
    const result = await getRegistrationById(id);
    if (result.success && result.data) {
      setRegistration(result.data as RegistrationWithRelations);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to load registration"));
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);

  const handleAction = async (
    action: string,
    fn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setActionLoading(action);
    startTransition(async () => {
      const result = await fn();
      if (result.success) {
        fetchRegistration();
      }
      setActionLoading(null);
    });
  };

  const handleApprove = () => handleAction("approve", () => approveRegistration(id));
  const handleReject = () => handleAction("reject", () => rejectRegistration(id));
  const handleWaitlist = () => handleAction("waitlist", () => waitlistRegistration(id));
  const handleCheckIn = () => handleAction("checkin", () => checkInRegistration(id, "manual"));
  const handleCancel = () => handleAction("cancel", () => cancelRegistration(id, "Cancelled by admin"));
  const handleDelete = () => handleAction("delete", () => deleteRegistration(id));

  const handleCopyPass = () => {
    if (registration?.passNumber) {
      navigator.clipboard.writeText(registration.passNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-[220px]" />
            <Skeleton className="h-4 w-[140px]" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-14 w-14 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">{error || "Registration not found"}</h3>
            <Button className="mt-4" onClick={() => router.push("/dashboard/admin/registrations")}>
              Back to Registrations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const regAny = registration as any;
  const discordUsername = regAny.user?.discordAccount?.nickname || regAny.user?.username;
  const discordId = regAny.user?.discordAccount?.discordUserId;
  const approvedByName = regAny.approvedByUser?.username || regAny.approvedByUser?.globalName;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Registration Details
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#{registration.passNumber}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyPass}>
                {copied ? <CheckCheck className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </Button>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[registration.status]}`}>
                {STATUS_ICONS[registration.status]}
                {REGISTRATION_STATUS_LABELS[registration.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {registration.status === "PENDING" && (
            <>
              <Button onClick={handleApprove} disabled={isPending} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                {actionLoading === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isPending} size="sm">
                {actionLoading === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject
              </Button>
              <Button variant="outline" onClick={handleWaitlist} disabled={isPending} size="sm">
                {actionLoading === "waitlist" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                Waitlist
              </Button>
            </>
          )}
          {registration.status === "APPROVED" && (
            <>
              <Button onClick={handleCheckIn} disabled={isPending} size="sm" className="bg-purple-600 hover:bg-purple-700">
                {actionLoading === "checkin" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Check In
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isPending} size="sm">
                {actionLoading === "cancel" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Cancel
              </Button>
            </>
          )}
          {registration.status === "WAITLISTED" && (
            <>
              <Button onClick={handleApprove} disabled={isPending} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                {actionLoading === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isPending} size="sm">
                {actionLoading === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/admin/events/${registration.event?.id}`)}
            disabled={!registration.event?.id}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Event
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/admin/registrations`)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Participant Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Participant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {registration.user.avatarUrl && (
                    <AvatarImage src={registration.user.avatarUrl} alt={registration.user.username} />
                  )}
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {(registration.user.globalName || registration.user.username)?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {registration.user.globalName || registration.user.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{registration.user.username}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1 divide-y">
                <InfoRow label="Email" value={registration.user.email} />
                {registration.user.bio && <InfoRow label="Bio" value={registration.user.bio} />}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Discord Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4 w-4 text-indigo-500" />
                Discord Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 divide-y">
              <InfoRow label="Discord Username" value={discordUsername ? `@${discordUsername}` : undefined} mono />
              <InfoRow label="Discord ID" value={discordId} mono />
              <InfoRow label="Discord Message ID" value={regAny.discordMessageId} mono />
              <InfoRow label="Discord Channel ID" value={regAny.discordChannelId} mono />
              {!discordUsername && !discordId && (
                <p className="py-4 text-sm text-muted-foreground text-center">No Discord information available</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Registration Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Registration Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pass Number</p>
                  <p className="font-mono text-lg font-bold">#{registration.passNumber}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${STATUS_BADGE_STYLES[registration.status]}`}>
                  {STATUS_ICONS[registration.status]}
                  {REGISTRATION_STATUS_LABELS[registration.status]}
                </span>
              </div>
              {registration.qrCode && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <QrCode className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">QR Code</p>
                    <p className="font-mono text-xs text-muted-foreground truncate">{registration.qrCode}</p>
                  </div>
                </div>
              )}
              <Separator />
              <div className="space-y-1 divide-y">
                <InfoRow label="Registration Time" value={formatDateTime(registration.registeredAt)} />
                {registration.approvedAt && (
                  <InfoRow label="Approval Time" value={formatDateTime(registration.approvedAt)} />
                )}
                {approvedByName && (
                  <InfoRow label="Approved By" value={approvedByName} />
                )}
                {registration.checkedInAt && (
                  <InfoRow label="Checked In At" value={formatDateTime(registration.checkedInAt)} />
                )}
                {registration.cancelReason && (
                  <div className="flex items-start justify-between gap-4 py-2">
                    <span className="text-sm text-muted-foreground shrink-0">Cancel Reason</span>
                    <span className="text-sm font-medium text-destructive text-right">{registration.cancelReason}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Festival & Event */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Festival & Event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {registration.festival && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Festival</p>
                  </div>
                  <p className="font-semibold">{registration.festival.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{registration.festival.slug}</p>
                </div>
              )}
              {registration.event && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Event</p>
                  </div>
                  <p className="font-semibold">{registration.event.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(registration.event.startDate)}
                    </span>
                    {registration.event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {registration.event.location}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {registration.event && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/admin/events/${registration.event!.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Event Details
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${registration.checkedInAt ? "bg-purple-100 dark:bg-purple-900/40" : "bg-gray-100 dark:bg-gray-800"}`}>
                {registration.checkedInAt ? (
                  <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {registration.checkedInAt ? "Checked In" : "Not Checked In"}
                </p>
                {registration.checkedInAt && (
                  <p className="text-sm text-muted-foreground">{formatDateTime(registration.checkedInAt)}</p>
                )}
              </div>
              {registration.status === "APPROVED" && !registration.checkedInAt && (
                <Button
                  size="sm"
                  className="ml-auto bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleAction("checkin", () => checkInRegistration(id, "manual"))}
                  disabled={isPending}
                >
                  {actionLoading === "checkin" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                  Check In Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Responses */}
      {registration.responses && registration.responses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Form Responses
              </CardTitle>
              <CardDescription>User-submitted form data for this registration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {registration.responses.map((response) => (
                  <div key={response.id} className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {response.formField.label}
                    </p>
                    <p className="text-sm font-medium">{response.responseValue || "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary" />
              Notes
            </CardTitle>
            <CardDescription>Internal and public notes for this registration</CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationNotes
              registrationId={registration.id}
              notes={registration.notesList || []}
              onNoteAdded={fetchRegistration}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Activity Timeline
            </CardTitle>
            <CardDescription>History of all actions and status changes</CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationTimeline timeline={registration.timeline || []} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this registration. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending} size="sm">
              {actionLoading === "delete" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Registration
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

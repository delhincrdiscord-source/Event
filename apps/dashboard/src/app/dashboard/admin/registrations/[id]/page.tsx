"use client";

import { useState, useEffect, useCallback, use, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  FileText,
  Calendar,
  MapPin,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  Loader2,
  Trash2,
  CalendarDays,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
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
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  waitlistRegistration,
  cancelRegistration,
  checkInRegistration,
  deleteRegistration,
} from "../_actions/registration";
import { RegistrationTimeline } from "../_components/timeline";
import type { RegistrationWithRelations } from "@gameverse/types";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
} from "@gameverse/types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  APPROVED: <CheckCircle2 className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
  WAITLISTED: <AlertTriangle className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
  CHECKED_IN: <UserCheck className="h-4 w-4" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
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

export default function RegistrationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [registration, setRegistration] =
    useState<RegistrationWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

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

  const handleApprove = () =>
    handleAction("approve", () => approveRegistration(id));

  const handleReject = () =>
    handleAction("reject", () => rejectRegistration(id));

  const handleWaitlist = () =>
    handleAction("waitlist", () => waitlistRegistration(id));

  const handleCheckIn = () =>
    handleAction("checkin", () => checkInRegistration(id, "manual"));

  const handleCancel = () =>
    handleAction("cancel", () => cancelRegistration(id, "Cancelled by admin"));

  const handleDelete = () =>
    handleAction("delete", () => deleteRegistration(id));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {error || "Registration not found"}
            </h3>
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/admin/registrations")}
            >
              Back to Registrations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Registration Details
            </h1>
            <p className="text-muted-foreground">
              Pass #{registration.passNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {registration.status === "PENDING" && (
            <>
              <Button
                onClick={handleApprove}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending}
              >
                {actionLoading === "reject" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={handleWaitlist}
                disabled={isPending}
              >
                {actionLoading === "waitlist" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                Waitlist
              </Button>
            </>
          )}
          {registration.status === "APPROVED" && (
            <>
              <Button
                onClick={handleCheckIn}
                disabled={isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {actionLoading === "checkin" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Check In
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                {actionLoading === "cancel" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Cancel
              </Button>
            </>
          )}
          {registration.status === "WAITLISTED" && (
            <>
              <Button
                onClick={handleApprove}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending}
              >
                {actionLoading === "reject" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                  {registration.user.username?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {registration.user.globalName ||
                      registration.user.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{registration.user.username}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{registration.user.email}</span>
                </div>
                {registration.user.bio && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">
                      {registration.user.bio}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Registration Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Number</p>
                  <p className="font-mono font-semibold">
                    {registration.passNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={`${REGISTRATION_STATUS_COLORS[registration.status]} flex items-center gap-1 w-fit mt-1`}
                  >
                    {STATUS_ICONS[registration.status]}
                    {REGISTRATION_STATUS_LABELS[registration.status]}
                  </Badge>
                </div>
              </div>
              {registration.qrCode && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-white">
                    <QrCode className="h-16 w-16 text-black" />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                    {registration.qrCode}
                  </p>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Registered</span>
                  <span>{formatDateTime(registration.registeredAt)}</span>
                </div>
                {registration.approvedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Approved</span>
                    <span>{formatDateTime(registration.approvedAt)}</span>
                  </div>
                )}
                {registration.checkedInAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Checked In</span>
                    <span>{formatDateTime(registration.checkedInAt)}</span>
                  </div>
                )}
                {registration.cancelReason && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cancel Reason</span>
                    <span className="text-destructive">
                      {registration.cancelReason}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Event Info Card */}
      {registration.event && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {registration.event.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(registration.event.startDate)} -{" "}
                      {formatDate(registration.event.endDate)}
                    </div>
                    {registration.event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {registration.event.location}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/dashboard/events/${registration.event!.id}`
                    )
                  }
                >
                  View Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Form Responses */}
      {registration.responses && registration.responses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Form Responses
              </CardTitle>
              <CardDescription>
                User-submitted form data for this registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registration.responses.map((response) => (
                  <div
                    key={response.id}
                    className="flex flex-col gap-1 rounded-lg border p-3"
                  >
                    <p className="text-sm font-medium text-muted-foreground">
                      {response.formField.label}
                    </p>
                    <p className="text-sm">{response.responseValue || "—"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notes
            </CardTitle>
            <CardDescription>
              Internal and public notes for this registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registration?.notesList && registration.notesList.length > 0 ? (
              <div className="space-y-3">
                {registration.notesList.map((note) => (
                  <div key={note.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium text-xs text-muted-foreground mb-1">
                      {(note as any).authorName || note.author?.username || "Admin"} • {new Date(note.createdAt).toLocaleString()}
                    </p>
                    <p>{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes recorded.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              History of all actions and status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationTimeline timeline={registration.timeline || []} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this registration. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
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

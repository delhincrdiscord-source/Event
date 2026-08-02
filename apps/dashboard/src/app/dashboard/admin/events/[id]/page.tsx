"use client";

import { useState, useEffect, useCallback, use, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Globe, ArrowUpFromLine, Archive, Calendar, Clock, MapPin, MessageSquare, Users, Settings, Image, ExternalLink,  } from "lucide-react";
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
  getEventById,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  archiveEvent,
} from "../_actions/event";
import {
  DeleteEventDialog,
  PublishEventDialog,
} from "../_components";
import type { CommunityEventWithRelations } from "@gameverse/types";
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  EVENT_VISIBILITY_LABELS,
  EVENT_VISIBILITY_COLORS,
  TIMEZONE_OPTIONS,
} from "@gameverse/types";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState<CommunityEventWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    const result = await getEventById(id);
    if (result.success && result.data) {
      setEvent(result.data);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to load event"));
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteEvent(id);
      if (result.success) {
        setDeleteDialogOpen(false);
        router.push("/dashboard/admin/events");
      }
    });
  };

  const handlePublish = async () => {
    startTransition(async () => {
      const result = await publishEvent(id);
      if (result.success) {
        setPublishDialogOpen(false);
        fetchEvent();
      }
    });
  };

  const handleUnpublish = async () => {
    startTransition(async () => {
      const result = await unpublishEvent(id);
      if (result.success) {
        setPublishDialogOpen(false);
        fetchEvent();
      }
    });
  };

  const handleArchive = async () => {
    startTransition(async () => {
      const result = await archiveEvent(id);
      if (result.success) {
        fetchEvent();
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimezoneLabel = (tz: string) => {
    return TIMEZONE_OPTIONS.find((t) => t.value === tz)?.label || tz;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-4 w-[250px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/events")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Event Details</h1>
            <p className="text-destructive">{error || "Event not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/events")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {event.category?.emoji && (
                  <span className="mr-2">{event.category.emoji}</span>
                )}
                {event.title}
              </h1>
              <Badge
                className={`${EVENT_STATUS_COLORS[event.status]} flex items-center gap-1`}
              >
                {EVENT_STATUS_LABELS[event.status]}
              </Badge>
              <Badge
                className={`${EVENT_VISIBILITY_COLORS[event.visibility]} flex items-center gap-1`}
              >
                {EVENT_VISIBILITY_LABELS[event.visibility]}
              </Badge>
              {event.isFeatured && (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                >
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {event.shortDescription || event.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/events/${id}/edit`)
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {event.status === "DRAFT" && (
            <Button onClick={() => setPublishDialogOpen(true)}>
              <Globe className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          {event.status === "PUBLISHED" && (
            <Button variant="outline" onClick={() => setPublishDialogOpen(true)}>
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Unpublish
            </Button>
          )}
          {event.status !== "ARCHIVED" && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Event Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Event details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <p className="text-sm">{event.title}</p>
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <p className="text-sm font-mono">{event.slug}</p>
              </div>
              {event.shortDescription && (
                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <p className="text-sm">{event.shortDescription}</p>
                </div>
              )}
              {event.fullDescription && (
                <div className="space-y-2">
                  <Label>Full Description</Label>
                  <p className="text-sm whitespace-pre-wrap">
                    {event.fullDescription}
                  </p>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  {event.category ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/categories/${event.category.id}`
                        )
                      }
                    >
                      {event.category.emoji && (
                        <span className="mr-1">{event.category.emoji}</span>
                      )}
                      {event.category.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">N/A</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Festival</Label>
                  {event.festival ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/festivals/${event.festival.id}`
                        )
                      }
                    >
                      {event.festival.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">N/A</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>RSVPs</Label>
                <p className="text-sm">{event._count?.rsvps || 0} registered</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
              <CardDescription>When and where the event takes place</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(event.startDate)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatTime(event.startDate)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End Date & Time</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(event.endDate)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatTime(event.endDate)}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Timezone</Label>
                <p className="text-sm">{getTimezoneLabel(event.timezone)}</p>
              </div>
              {event.location && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {event.location}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Discord Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discord Configuration
              </CardTitle>
              <CardDescription>Voice and stage channel settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Channel ID</Label>
                <p className="text-sm font-mono">
                  {event.discordVoiceChannelId || "Not configured"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Stage Channel ID</Label>
                <p className="text-sm font-mono">
                  {event.discordStageChannelId || "Not configured"}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <p className="text-sm">
                    {event.capacity || "Unlimited"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Waitlist</Label>
                  <p className="text-sm">
                    {event.waitlistEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registration
              </CardTitle>
              <CardDescription>Registration settings and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Registration</Label>
                <p className="text-sm">
                  {event.registrationEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              {event.registrationEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Registration Start</Label>
                      <p className="text-sm">
                        {event.registrationStart
                          ? formatDateTime(event.registrationStart)
                          : "Not set"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Registration End</Label>
                      <p className="text-sm">
                        {event.registrationEnd
                          ? formatDateTime(event.registrationEnd)
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Badge
                    className={`${EVENT_VISIBILITY_COLORS[event.visibility]}`}
                  >
                    {EVENT_VISIBILITY_LABELS[event.visibility]}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Featured</Label>
                  <p className="text-sm">
                    {event.isFeatured ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Media Section */}
      {(event.bannerUrl || event.thumbnailUrl) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Media
              </CardTitle>
              <CardDescription>Banner and thumbnail images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {event.bannerUrl && (
                  <div className="space-y-2">
                    <Label>Banner</Label>
                    <div className="overflow-hidden rounded-lg border">
                      <img
                        src={event.bannerUrl}
                        alt="Event banner"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {event.thumbnailUrl && (
                  <div className="space-y-2">
                    <Label>Thumbnail</Label>
                    <div className="overflow-hidden rounded-lg border">
                      <img
                        src={event.thumbnailUrl}
                        alt="Event thumbnail"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dialogs */}
      <DeleteEventDialog
        eventTitle={event.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
      <PublishEventDialog
        eventTitle={event.title}
        isPublished={event.status === "PUBLISHED"}
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onConfirm={
          event.status === "PUBLISHED" ? handleUnpublish : handlePublish
        }
        isPending={isPending}
      />
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ""}`}
    >
      {children}
    </p>
  );
}

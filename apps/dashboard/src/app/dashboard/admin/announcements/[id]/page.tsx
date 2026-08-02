"use client";

import { useState, useEffect, useCallback, use, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Globe, Archive, Clock, Eye, Tag, Pin, Calendar, User, Megaphone, Settings, Image, Copy, ExternalLink,  } from "lucide-react";
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
  getAnnouncementById,
  deleteAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
} from "../_actions/announcement";
import { duplicateAnnouncement } from "../_actions/announcement";
import {
  DeleteAnnouncementDialog,
} from "../_components";
import type { AnnouncementWithRelations } from "@gameverse/types";
import {
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_STATUS_COLORS,
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_PRIORITY_COLORS,
  ANNOUNCEMENT_VISIBILITY_LABELS,
} from "@gameverse/types";

export default function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState<AnnouncementWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    setIsLoading(true);
    const result = await getAnnouncementById(id);
    if (result.success && result.data) {
      setAnnouncement(result.data);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to load announcement"));
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        setDeleteDialogOpen(false);
        router.push("/dashboard/admin/announcements");
      }
    });
  };

  const handlePublish = async () => {
    startTransition(async () => {
      const result = await publishAnnouncement(id);
      if (result.success) {
        fetchAnnouncement();
      }
    });
  };

  const handleArchive = async () => {
    startTransition(async () => {
      const result = await archiveAnnouncement(id);
      if (result.success) {
        fetchAnnouncement();
      }
    });
  };

  const handleDuplicate = async () => {
    if (!announcement) return;
    startTransition(async () => {
      const result = await duplicateAnnouncement(announcement.id, {
        title: `${announcement.title} (Copy)`,
        slug: `${announcement.slug}-copy`,
      });
      if (result.success && result.data) {
        router.push(`/dashboard/announcements/${result.data.id}/edit`);
      }
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (error || !announcement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/announcements")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcement Details</h1>
            <p className="text-destructive">{error || "Announcement not found"}</p>
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
            onClick={() => router.push("/dashboard/admin/announcements")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {announcement.title}
              </h1>
              {announcement.isPinned && (
                <Pin className="h-5 w-5 text-yellow-500" />
              )}
              <Badge
                className={`${ANNOUNCEMENT_STATUS_COLORS[announcement.status]} flex items-center gap-1`}
              >
                {ANNOUNCEMENT_STATUS_LABELS[announcement.status]}
              </Badge>
              <Badge
                className={`${ANNOUNCEMENT_PRIORITY_COLORS[announcement.priority]} flex items-center gap-1`}
              >
                {ANNOUNCEMENT_PRIORITY_LABELS[announcement.priority]}
              </Badge>
              <Badge variant="outline">
                {ANNOUNCEMENT_VISIBILITY_LABELS[announcement.visibility]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {announcement.summary || announcement.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/announcements/${id}/edit`)
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {announcement.status === "DRAFT" && (
            <Button onClick={handlePublish}>
              <Globe className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          {announcement.status !== "ARCHIVED" && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Announcement Details */}
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
              <CardDescription>Announcement details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Title</p>
                <p className="text-sm">{announcement.title}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Slug</p>
                <p className="text-sm font-mono">{announcement.slug}</p>
              </div>
              {announcement.summary && (
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Summary</p>
                  <p className="text-sm">{announcement.summary}</p>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Festival</p>
                  {announcement.festival ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/festivals/${announcement.festival!.id}`
                        )
                      }
                    >
                      {announcement.festival.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">N/A</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Pinned</p>
                  <p className="text-sm">
                    {announcement.isPinned ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              {announcement.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {announcement.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Author & Schedule Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Author & Schedule
              </CardTitle>
              <CardDescription>Who created it and when</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Author</p>
                <div className="flex items-center gap-2">
                  {announcement.author?.avatarUrl ? (
                    <img
                      src={announcement.author.avatarUrl}
                      alt={announcement.author.username}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {announcement.author?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm">
                    {announcement.author?.username || "Unknown"}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Created</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(announcement.createdAt)}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Last Updated</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDateTime(announcement.updatedAt)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Publish At</p>
                  <p className="text-sm">
                    {formatDateTime(announcement.publishAt ?? null)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Expire At</p>
                  <p className="text-sm">
                    {formatDateTime(announcement.expireAt ?? null)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Content
              </CardTitle>
              <CardDescription>Full announcement content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Preview</p>
                <div className="rounded-lg border bg-muted/50 p-4 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {announcement.content}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Word Count</p>
                <p className="text-sm">
                  {announcement.content.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Media & Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Media & Stats
              </CardTitle>
              <CardDescription>Banner image and delivery statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcement.bannerUrl ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Banner</p>
                  <div className="overflow-hidden rounded-lg border">
                    <img
                      src={announcement.bannerUrl}
                      alt="Announcement banner"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Banner</p>
                  <p className="text-sm text-muted-foreground">No banner image</p>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Delivery Stats</p>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{announcement.viewCount} views</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <span>{announcement.deliveries?.length || 0} deliveries</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Dialog */}
      <DeleteAnnouncementDialog
        announcementTitle={announcement.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}

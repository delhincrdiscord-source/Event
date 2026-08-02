"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Megaphone,
  Settings,
  Globe,
  Calendar,
  Tag,
  Image,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import { Textarea } from "@gameverse/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gameverse/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";
import { Switch } from "@gameverse/ui/switch";
import { Separator } from "@gameverse/ui/separator";

import { createAnnouncement } from "../_actions/announcement";
import { getAllFestivals } from "../../festivals/_actions/festival";
import type {
  CreateAnnouncementInput,
  AnnouncementPriority,
  AnnouncementVisibility,
  AnnouncementStatus,
  FestivalListItem,
} from "@gameverse/types";

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAnnouncementInput>({
    title: "",
    slug: "",
    summary: "",
    content: "",
    bannerUrl: "",
    authorId: "",
    festivalId: "",
    priority: "NORMAL",
    visibility: "PUBLIC",
    status: "DRAFT",
    publishAt: "",
    expireAt: "",
    tags: [],
    isPinned: false,
  });
  const [tagsInput, setTagsInput] = useState("");

  const fetchFestivals = useCallback(async () => {
    const result = await getAllFestivals();
    if (result.success && result.data) {
      setFestivals(result.data);
    }
  }, []);

  useEffect(() => {
    fetchFestivals();
  }, [fetchFestivals]);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: generateSlug(value),
    }));
  };

  const handleFieldChange = (
    field: keyof CreateAnnouncementInput,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.slug || !formData.content) {
      setError("Please fill in all required fields (title, slug, content)");
      return;
    }

    setIsSubmitting(true);

    const result = await createAnnouncement({
      ...formData,
      status: formData.status || "DRAFT",
      priority: formData.priority || "NORMAL",
      visibility: formData.visibility || "PUBLIC",
      isPinned: formData.isPinned ?? false,
      tags: formData.tags ?? [],
      authorId: "admin",
    });

    if (result.success && result.data) {
      router.push(`/dashboard/announcements/${result.data.id}`);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to create announcement"));
    }

    setIsSubmitting(false);
  };

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
          <h1 className="text-3xl font-bold tracking-tight">
            Create Announcement
          </h1>
          <p className="text-muted-foreground">
            Publish a new announcement for your community
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

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
                <CardDescription>
                  Essential details about your announcement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter announcement title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      handleFieldChange("slug", e.target.value)
                    }
                    placeholder="announcement-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary || ""}
                    onChange={(e) =>
                      handleFieldChange("summary", e.target.value)
                    }
                    placeholder="Brief summary of the announcement"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">
                    Content <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      handleFieldChange("content", e.target.value)
                    }
                    placeholder="Full announcement content (supports Markdown)"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports Markdown formatting
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Festival</Label>
                  <Select
                    value={formData.festivalId || "NONE"}
                    onValueChange={(value) =>
                      handleFieldChange(
                        "festivalId",
                        value === "NONE" ? undefined : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a festival (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {festivals.map((festival) => (
                        <SelectItem key={festival.id} value={festival.id}>
                          {festival.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Settings
                </CardTitle>
                <CardDescription>
                  Visibility, priority, and status settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleFieldChange("status", value as AnnouncementStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleFieldChange("priority", value as AnnouncementPriority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) =>
                      handleFieldChange(
                        "visibility",
                        value as AnnouncementVisibility
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                      <SelectItem value="ADMINS_ONLY">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pinned</Label>
                    <p className="text-sm text-muted-foreground">
                      Pin this announcement to the top
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPinned || false}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isPinned", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Scheduling Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduling
                </CardTitle>
                <CardDescription>
                  Set publish and expiration dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publishAt">Publish At</Label>
                  <Input
                    id="publishAt"
                    type="datetime-local"
                    value={formData.publishAt || ""}
                    onChange={(e) =>
                      handleFieldChange("publishAt", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to publish immediately
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expireAt">Expire At</Label>
                  <Input
                    id="expireAt"
                    type="datetime-local"
                    value={formData.expireAt || ""}
                    onChange={(e) =>
                      handleFieldChange("expireAt", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Media & Tags Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Media & Tags
                </CardTitle>
                <CardDescription>
                  Banner image and tags for categorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Banner URL</Label>
                  <Input
                    id="bannerUrl"
                    value={formData.bannerUrl || ""}
                    onChange={(e) =>
                      handleFieldChange("bannerUrl", e.target.value)
                    }
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                {formData.bannerUrl && (
                  <div className="overflow-hidden rounded-lg border">
                    <img
                      src={formData.bannerUrl}
                      alt="Banner preview"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated tags for categorization
                  </p>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Submit Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex justify-end gap-4 mt-6"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/announcements")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              if (!formData.title || !formData.slug || !formData.content) {
                setError("Please fill in all required fields");
                return;
              }
              setIsSubmitting(true);
              const result = await createAnnouncement({
                ...formData,
                status: "DRAFT",
                priority: formData.priority || "NORMAL",
                visibility: formData.visibility || "PUBLIC",
                isPinned: formData.isPinned ?? false,
                tags: formData.tags ?? [],
                authorId: "admin",
              });
              if (result.success && result.data) {
                router.push(`/dashboard/announcements/${result.data.id}`);
              } else {
                setError(result.success ? "" : (result.error ?? "Failed to save draft"));
              }
              setIsSubmitting(false);
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save as Draft
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

function Badge({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
        variant === "secondary" ?"bg-secondary text-secondary-foreground" :"bg-primary text-primary-foreground"
      } ${className || ""}`}
    >
      {children}
    </span>
  );
}

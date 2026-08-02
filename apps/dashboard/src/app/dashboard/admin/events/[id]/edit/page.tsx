"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  MessageSquare,
  Users,
  Settings,
  Globe,
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
import { Skeleton } from "@gameverse/ui/skeleton";

import { getEventById, updateEvent, checkEventConflict } from "../../_actions/event";
import { getAllCategories } from "../../../categories/_actions/category";
import { getAllFestivals } from "../../../festivals/_actions/festival";
import type {
  UpdateEventInput,
  EventCategoryListItem,
  FestivalListItem,
  EventVisibility,
  CommunityEventWithRelations,
} from "@gameverse/types";
import { TIMEZONE_OPTIONS } from "@gameverse/types";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<EventCategoryListItem[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [event, setEvent] = useState<CommunityEventWithRelations | null>(null);

  const [formData, setFormData] = useState<UpdateEventInput>({
    festivalId: "",
    categoryId: "",
    title: "",
    slug: "",
    shortDescription: "",
    fullDescription: "",
    bannerUrl: "",
    thumbnailUrl: "",
    startDate: "",
    endDate: "",
    timezone: "Asia/Kolkata",
    location: "",
    discordVoiceChannelId: "",
    discordStageChannelId: "",
    capacity: undefined,
    waitlistEnabled: false,
    registrationEnabled: true,
    registrationStart: "",
    registrationEnd: "",
    visibility: "PUBLIC",
    isFeatured: false,
  });

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    const result = await getEventById(id);
    if (result.success && result.data) {
      setEvent(result.data);
      const event = result.data;
      setFormData({
        festivalId: event.festivalId,
        categoryId: event.categoryId,
        title: event.title,
        slug: event.slug,
        shortDescription: event.shortDescription || "",
        fullDescription: event.fullDescription || "",
        bannerUrl: event.bannerUrl || "",
        thumbnailUrl: event.thumbnailUrl || "",
        startDate: new Date(event.startDate).toISOString().slice(0, 16),
        endDate: new Date(event.endDate).toISOString().slice(0, 16),
        timezone: event.timezone,
        location: event.location || "",
        discordVoiceChannelId: event.discordVoiceChannelId || "",
        discordStageChannelId: event.discordStageChannelId || "",
        capacity: event.capacity || undefined,
        waitlistEnabled: event.waitlistEnabled,
        registrationEnabled: event.registrationEnabled,
        registrationStart: event.registrationStart
          ? new Date(event.registrationStart).toISOString().slice(0, 16)
          : "",
        registrationEnd: event.registrationEnd
          ? new Date(event.registrationEnd).toISOString().slice(0, 16)
          : "",
        visibility: event.visibility,
        isFeatured: event.isFeatured,
      });
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to load event"));
    }
    setIsLoading(false);
  }, [id]);

  const fetchCategories = useCallback(async () => {
    const result = await getAllCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    }
  }, []);

  const fetchFestivals = useCallback(async () => {
    const result = await getAllFestivals();
    if (result.success && result.data) {
      setFestivals(result.data);
    }
  }, []);

  useEffect(() => {
    fetchEvent();
    fetchCategories();
    fetchFestivals();
  }, [fetchEvent, fetchCategories, fetchFestivals]);

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

  const handleFieldChange = (field: keyof UpdateEventInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const checkConflict = useCallback(async () => {
    if (
      formData.discordVoiceChannelId &&
      formData.startDate &&
      formData.endDate
    ) {
      const result = await checkEventConflict(
        formData.startDate,
        formData.endDate,
        formData.discordVoiceChannelId,
        "voice",
        id
      );
      if (result.success && result.data) {
        if (result.data.hasConflict) {
          setConflictError(
            `Channel conflict with: ${result.data.conflictingEvents.map((e) => e.title).join(", ")}`
          );
        } else {
          setConflictError(null);
        }
      }
    }
  }, [formData.startDate, formData.endDate, formData.discordVoiceChannelId, id]);

  useEffect(() => {
    checkConflict();
  }, [checkConflict]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.slug || !formData.festivalId || !formData.categoryId) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Please select start and end dates");
      return;
    }

    if (conflictError) {
      setError("Please resolve the channel conflict before submitting");
      return;
    }

    setIsSubmitting(true);

    const result = await updateEvent(id, formData);

    if (result.success && result.data) {
      router.push(`/dashboard/events/${id}`);
    } else {
      setError(!result.success ? (result.error ?? "Failed to update event") : "Failed to update event");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
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
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !event) {
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/events/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground">
            Update {event?.title} details
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
                  Essential details about your event
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
                    placeholder="Enter event title"
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
                    placeholder="event-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription || ""}
                    onChange={(e) =>
                      handleFieldChange("shortDescription", e.target.value)
                    }
                    placeholder="Brief description (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullDescription">Full Description</Label>
                  <Textarea
                    id="fullDescription"
                    value={formData.fullDescription || ""}
                    onChange={(e) =>
                      handleFieldChange("fullDescription", e.target.value)
                    }
                    placeholder="Detailed description of your event"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      handleFieldChange("categoryId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.emoji && `${category.emoji} `}
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Festival <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.festivalId}
                    onValueChange={(value) =>
                      handleFieldChange("festivalId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a festival" />
                    </SelectTrigger>
                    <SelectContent>
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
                <CardDescription>When your event takes place</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleFieldChange("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleFieldChange("endDate", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      handleFieldChange("timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) =>
                      handleFieldChange("location", e.target.value)
                    }
                    placeholder="Physical or virtual location"
                  />
                </div>
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
                <CardDescription>
                  Voice and stage channel settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voiceChannel">Voice Channel ID</Label>
                  <Input
                    id="voiceChannel"
                    value={formData.discordVoiceChannelId || ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "discordVoiceChannelId",
                        e.target.value
                      )
                    }
                    placeholder="Discord voice channel ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stageChannel">Stage Channel ID</Label>
                  <Input
                    id="stageChannel"
                    value={formData.discordStageChannelId || ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "discordStageChannelId",
                        e.target.value
                      )
                    }
                    placeholder="Discord stage channel ID"
                  />
                </div>
                {conflictError && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                    {conflictError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity || ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "capacity",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="Maximum attendees (optional)"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Waitlist</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow attendees to join a waitlist when full
                    </p>
                  </div>
                  <Switch
                    checked={formData.waitlistEnabled}
                    onCheckedChange={(checked) =>
                      handleFieldChange("waitlistEnabled", checked)
                    }
                  />
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
                <CardDescription>
                  Manage event registration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow attendees to register for this event
                    </p>
                  </div>
                  <Switch
                    checked={formData.registrationEnabled}
                    onCheckedChange={(checked) =>
                      handleFieldChange("registrationEnabled", checked)
                    }
                  />
                </div>
                {formData.registrationEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regStart">Registration Start</Label>
                      <Input
                        id="regStart"
                        type="datetime-local"
                        value={formData.registrationStart || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "registrationStart",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regEnd">Registration End</Label>
                      <Input
                        id="regEnd"
                        type="datetime-local"
                        value={formData.registrationEnd || ""}
                        onChange={(e) =>
                          handleFieldChange("registrationEnd", e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) =>
                      handleFieldChange("visibility", value as EventVisibility)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                      <SelectItem value="HIDDEN">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Featured Event</Label>
                    <p className="text-sm text-muted-foreground">
                      Highlight this event in listings
                    </p>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      handleFieldChange("isFeatured", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Media URLs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-6"
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
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    value={formData.thumbnailUrl || ""}
                    onChange={(e) =>
                      handleFieldChange("thumbnailUrl", e.target.value)
                    }
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="flex justify-end gap-4 mt-6"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/events/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

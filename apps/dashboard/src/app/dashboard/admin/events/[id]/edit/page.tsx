"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Calendar, MessageSquare, Users, Settings } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import { Textarea } from "@gameverse/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@gameverse/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@gameverse/ui/select";
import { Switch } from "@gameverse/ui/switch";
import { Skeleton } from "@gameverse/ui/skeleton";

import { getEventById, updateEvent } from "../../_actions/event";
import { getAllCategories } from "../../../categories/_actions/category";
import { getAllFestivals } from "../../../festivals/_actions/festival";
import type { UpdateEventInput, EventCategoryListItem, FestivalListItem, EventVisibility } from "@gameverse/types";
import { TIMEZONE_OPTIONS } from "@gameverse/types";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<EventCategoryListItem[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateEventInput>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [eventResult, catResult, festResult] = await Promise.all([
      getEventById(id),
      getAllCategories(),
      getAllFestivals(),
    ]);
    if (eventResult.success && eventResult.data) {
      const e = eventResult.data;
      setFormData({
        festivalId: e.festivalId, categoryId: e.categoryId,
        title: e.title, slug: e.slug,
        shortDescription: e.shortDescription || "",
        fullDescription: e.fullDescription || "",
        bannerUrl: e.bannerUrl || "", thumbnailUrl: e.thumbnailUrl || "",
        startDate: new Date(e.startDate).toISOString().slice(0, 16),
        endDate: new Date(e.endDate).toISOString().slice(0, 16),
        timezone: e.timezone, location: e.location || "",
        discordVoiceChannelId: e.discordVoiceChannelId || "",
        discordStageChannelId: e.discordStageChannelId || "",
        capacity: e.capacity || undefined,
        waitlistEnabled: e.waitlistEnabled,
        registrationEnabled: e.registrationEnabled,
        registrationStart: e.registrationStart ? new Date(e.registrationStart).toISOString().slice(0, 16) : "",
        registrationEnd: e.registrationEnd ? new Date(e.registrationEnd).toISOString().slice(0, 16) : "",
        visibility: e.visibility, isFeatured: e.isFeatured,
      });
    } else {
      setError("Failed to load event");
    }
    if (catResult.success && catResult.data) setCategories(catResult.data);
    if (festResult.success && festResult.data) setFestivals(festResult.data);
    setIsLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const set = (field: keyof UpdateEventInput, value: any) => setFormData(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.title) { setError("Event name is required"); return; }
    setIsSubmitting(true);
    const result = await updateEvent(id, formData);
    if (result.success) {
      router.push(`/dashboard/admin/events/${id}`);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to update event"));
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4"><Skeleton className="h-10 w-10" /><Skeleton className="h-8 w-[200px]" /></div>
        <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/admin/events/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground">Update event details and settings</p>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Event Name <span className="text-destructive">*</span></Label>
                <Input value={formData.title || ""} onChange={e => set("title", e.target.value)} placeholder="Event name" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formData.slug || ""} onChange={e => set("slug", e.target.value)} placeholder="event-slug" />
              </div>
              <div className="space-y-2">
                <Label>Festival</Label>
                <Select value={formData.festivalId || ""} onValueChange={v => set("festivalId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select festival" /></SelectTrigger>
                  <SelectContent>{festivals.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.categoryId || ""} onValueChange={v => set("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji && `${c.emoji} `}{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input value={formData.shortDescription || ""} onChange={e => set("shortDescription", e.target.value)} placeholder="Brief description" />
              </div>
              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea value={formData.fullDescription || ""} onChange={e => set("fullDescription", e.target.value)} rows={4} placeholder="Detailed description" />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" value={formData.startDate || ""} onChange={e => set("startDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date & Time</Label>
                <Input type="datetime-local" value={formData.endDate || ""} onChange={e => set("endDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={formData.timezone || "Asia/Kolkata"} onValueChange={v => set("timezone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONE_OPTIONS.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={formData.location || ""} onChange={e => set("location", e.target.value)} placeholder="Physical or virtual location" />
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">Enable Registration</p><p className="text-xs text-muted-foreground">Allow participants to register</p></div>
                <Switch checked={formData.registrationEnabled ?? true} onCheckedChange={v => set("registrationEnabled", v)} />
              </div>
              {formData.registrationEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Registration Opens</Label>
                    <Input type="datetime-local" value={formData.registrationStart || ""} onChange={e => set("registrationStart", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration Closes</Label>
                    <Input type="datetime-local" value={formData.registrationEnd || ""} onChange={e => set("registrationEnd", e.target.value)} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input type="number" min={1} value={formData.capacity || ""} onChange={e => set("capacity", e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Unlimited" />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">Waitlist</p><p className="text-xs text-muted-foreground">Allow waitlist when full</p></div>
                <Switch checked={formData.waitlistEnabled ?? false} onCheckedChange={v => set("waitlistEnabled", v)} />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={formData.visibility || "PUBLIC"} onValueChange={v => set("visibility", v as EventVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                    <SelectItem value="HIDDEN">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">Featured</p><p className="text-xs text-muted-foreground">Highlight in listings</p></div>
                <Switch checked={formData.isFeatured ?? false} onCheckedChange={v => set("isFeatured", v)} />
              </div>
            </CardContent>
          </Card>

          {/* Discord & Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Discord & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Channel ID</Label>
                <Input value={formData.discordVoiceChannelId || ""} onChange={e => set("discordVoiceChannelId", e.target.value)} placeholder="Discord voice channel ID" />
              </div>
              <div className="space-y-2">
                <Label>Stage Channel ID</Label>
                <Input value={formData.discordStageChannelId || ""} onChange={e => set("discordStageChannelId", e.target.value)} placeholder="Discord stage channel ID" />
              </div>
              <div className="space-y-2">
                <Label>Banner URL</Label>
                <Input value={formData.bannerUrl || ""} onChange={e => set("bannerUrl", e.target.value)} placeholder="https://example.com/banner.jpg" />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={formData.thumbnailUrl || ""} onChange={e => set("thumbnailUrl", e.target.value)} placeholder="https://example.com/thumbnail.jpg" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/admin/events/${id}`)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

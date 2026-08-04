"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Loader2, MessageSquare, Users, Check, Info, Palette, Clock, Shield, Trophy, Plus, X,  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import { Textarea } from "@gameverse/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gameverse/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@gameverse/ui/select";
import { Switch } from "@gameverse/ui/switch";
import { Badge } from "@gameverse/ui/badge";
import { Separator } from "@gameverse/ui/separator";

import { createEvent } from "../_actions/event";
import { getAllCategories } from "../../categories/_actions/category";
import { getAllFestivals } from "../../festivals/_actions/festival";
import type { CreateEventInput, EventCategoryListItem, FestivalListItem, EventVisibility } from "@gameverse/types";
import { TIMEZONE_OPTIONS } from "@gameverse/types";

// ─── Wizard Steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: "Basic Info", description: "Event name, festival, game, category", icon: Info },
  { id: 2, title: "Branding", description: "Banner, thumbnail, theme color", icon: Palette },
  { id: 3, title: "Schedule", description: "Date, time, duration, timezone", icon: Clock },
  { id: 4, title: "Registration", description: "Slots, waitlist, open/close dates", icon: Users },
  { id: 5, title: "Staff", description: "Host, co-host, judges, moderators", icon: Shield },
  { id: 6, title: "Discord", description: "Channels, threads, role pings", icon: MessageSquare },
  { id: 7, title: "Rules & Rewards", description: "Requirements, instructions, prizes", icon: Trophy },
];

const THEME_COLORS = [
  "#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245",
  "#3BA55D", "#FAA61A", "#00B0F4", "#9B59B6", "#E67E22",
];

interface StaffEntry { name: string; discordId?: string }

interface WizardData extends CreateEventInput {
  themeColor?: string;
  hostName?: string;
  hostDiscordId?: string;
  coHostName?: string;
  coHostDiscordId?: string;
  judges?: StaffEntry[];
  moderators?: StaffEntry[];
  announcementChannelId?: string;
  threadId?: string;
  rolePingId?: string;
  rules?: string;
  requirements?: string;
  instructions?: string;
  rewardsPreview?: string;
  gameName?: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<EventCategoryListItem[]>([]);
  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [judgeInput, setJudgeInput] = useState("");
  const [modInput, setModInput] = useState("");

  const [data, setData] = useState<WizardData>({
    festivalId: "", categoryId: "", title: "", slug: "",
    shortDescription: "", fullDescription: "", bannerUrl: "", thumbnailUrl: "",
    startDate: "", endDate: "", timezone: "Asia/Kolkata", location: "",
    discordVoiceChannelId: "", discordStageChannelId: "",
    capacity: undefined, waitlistEnabled: false, registrationEnabled: true,
    registrationStart: "", registrationEnd: "", visibility: "PUBLIC", isFeatured: false,
    themeColor: "#5865F2", hostName: "", hostDiscordId: "", coHostName: "", coHostDiscordId: "",
    judges: [], moderators: [], announcementChannelId: "", threadId: "", rolePingId: "",
    rules: "", requirements: "", instructions: "", rewardsPreview: "", gameName: "",
  });

  useEffect(() => {
    getAllCategories().then(r => r.success && r.data && setCategories(r.data));
    getAllFestivals().then(r => r.success && r.data && setFestivals(r.data));
  }, []);

  const set = (field: keyof WizardData, value: any) => setData(p => ({ ...p, [field]: value }));

  const generateSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleTitleChange = (v: string) => setData(p => ({ ...p, title: v, slug: generateSlug(v) }));

  const addJudge = () => {
    if (!judgeInput.trim()) return;
    setData(p => ({ ...p, judges: [...(p.judges || []), { name: judgeInput.trim() }] }));
    setJudgeInput("");
  };

  const addMod = () => {
    if (!modInput.trim()) return;
    setData(p => ({ ...p, moderators: [...(p.moderators || []), { name: modInput.trim() }] }));
    setModInput("");
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!data.title) return "Event name is required";
      if (!data.festivalId) return "Please select a festival";
      if (!data.categoryId) return "Please select a category";
    }
    if (step === 3) {
      if (!data.startDate) return "Start date is required";
      if (!data.endDate) return "End date is required";
      if (new Date(data.endDate) <= new Date(data.startDate)) return "End date must be after start date";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => Math.min(s + 1, 7));
  };

  const handleBack = () => { setError(null); setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    const payload: CreateEventInput = {
      festivalId: data.festivalId, categoryId: data.categoryId,
      title: data.title, slug: data.slug,
      shortDescription: data.shortDescription, fullDescription: data.fullDescription,
      bannerUrl: data.bannerUrl, thumbnailUrl: data.thumbnailUrl,
      startDate: data.startDate, endDate: data.endDate,
      timezone: data.timezone, location: data.location,
      discordVoiceChannelId: data.discordVoiceChannelId,
      discordStageChannelId: data.discordStageChannelId,
      capacity: data.capacity, waitlistEnabled: data.waitlistEnabled,
      registrationEnabled: data.registrationEnabled,
      registrationStart: data.registrationStart, registrationEnd: data.registrationEnd,
      visibility: data.visibility, isFeatured: data.isFeatured,
    };
    const result = await createEvent(payload);
    if (result.success && result.data) {
      router.push(`/dashboard/admin/events/${result.data.id}`);
    } else {
      setError(result.success ? "" : (result.error ?? "Failed to create event"));
    }
    setIsSubmitting(false);
  };

  const getDuration = () => {
    if (!data.startDate || !data.endDate) return null;
    const diff = new Date(data.endDate).getTime() - new Date(data.startDate).getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin/events")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
          <p className="text-muted-foreground">Set up a new festival event in 7 steps</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1 flex-1">
                <div className="relative flex items-center justify-center">
                  {i > 0 && (
                    <div className={`absolute right-1/2 top-1/2 -translate-y-1/2 h-0.5 w-full ${isCompleted || isCurrent ? "bg-primary" : "bg-border"}`} style={{ width: "calc(100% - 2rem)", right: "calc(50% + 1rem)" }} />
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => step > s.id && setStep(s.id)}
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted ? "bg-primary border-primary text-primary-foreground" :
                      isCurrent ? "border-primary bg-primary/10 text-primary": "border-border bg-background text-muted-foreground"
                    } ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </motion.button>
                </div>
                <span className={`hidden sm:block text-xs font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
                Step {step}: {STEPS[step - 1].title}
              </CardTitle>
              <CardDescription>{STEPS[step - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Step 1: Basic Info */}
              {step === 1 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="title">Event Name <span className="text-destructive">*</span></Label>
                      <Input id="title" value={data.title} onChange={e => handleTitleChange(e.target.value)} placeholder="e.g. Summer Valorant Championship" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input id="slug" value={data.slug} onChange={e => set("slug", e.target.value)} placeholder="auto-generated" />
                    </div>
                    <div className="space-y-2">
                      <Label>Festival <span className="text-destructive">*</span></Label>
                      <Select value={data.festivalId} onValueChange={v => set("festivalId", v)}>
                        <SelectTrigger><SelectValue placeholder="Select festival" /></SelectTrigger>
                        <SelectContent>{festivals.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Game</Label>
                      <Input value={data.gameName || ""} onChange={e => set("gameName", e.target.value)} placeholder="e.g. Valorant, BGMI, Chess" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category <span className="text-destructive">*</span></Label>
                      <Select value={data.categoryId} onValueChange={v => set("categoryId", v)}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji && `${c.emoji} `}{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Short Description</Label>
                      <Input value={data.shortDescription || ""} onChange={e => set("shortDescription", e.target.value)} placeholder="Brief one-liner about the event" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Full Description</Label>
                      <Textarea value={data.fullDescription || ""} onChange={e => set("fullDescription", e.target.value)} placeholder="Detailed description of the event..." rows={4} />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Branding */}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Banner URL</Label>
                    <Input value={data.bannerUrl || ""} onChange={e => set("bannerUrl", e.target.value)} placeholder="https://example.com/banner.jpg" />
                    {data.bannerUrl && (
                      <div className="mt-2 overflow-hidden rounded-lg border h-40">
                        <img src={data.bannerUrl} alt="Banner preview" className="h-full w-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail URL</Label>
                    <Input value={data.thumbnailUrl || ""} onChange={e => set("thumbnailUrl", e.target.value)} placeholder="https://example.com/thumbnail.jpg" />
                    {data.thumbnailUrl && (
                      <div className="mt-2 overflow-hidden rounded-lg border h-24 w-24">
                        <img src={data.thumbnailUrl} alt="Thumbnail preview" className="h-full w-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label>Theme Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {THEME_COLORS.map(color => (
                        <button key={color} onClick={() => set("themeColor", color)}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${data.themeColor === color ? "border-white scale-110 shadow-lg" : "border-transparent"}`}
                          style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="color" value={data.themeColor || "#5865F2"} onChange={e => set("themeColor", e.target.value)} className="h-9 w-16 cursor-pointer rounded border" />
                      <Input value={data.themeColor || ""} onChange={e => set("themeColor", e.target.value)} placeholder="#5865F2" className="w-32" />
                      <div className="h-9 w-9 rounded-lg border" style={{ backgroundColor: data.themeColor || "#5865F2" }} />
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Schedule */}
              {step === 3 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date & Time <span className="text-destructive">*</span></Label>
                      <Input type="datetime-local" value={data.startDate} onChange={e => set("startDate", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date & Time <span className="text-destructive">*</span></Label>
                      <Input type="datetime-local" value={data.endDate} onChange={e => set("endDate", e.target.value)} />
                    </div>
                    {getDuration() && (
                      <div className="sm:col-span-2">
                        <Badge variant="outline" className="text-sm"><Clock className="mr-1 h-3 w-3" />Duration: {getDuration()}</Badge>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={data.timezone} onValueChange={v => set("timezone", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TIMEZONE_OPTIONS.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={data.location || ""} onChange={e => set("location", e.target.value)} placeholder="Physical or virtual location" />
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Registration */}
              {step === 4 && (
                <>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Registration Required</p>
                      <p className="text-sm text-muted-foreground">Allow participants to register for this event</p>
                    </div>
                    <Switch checked={data.registrationEnabled} onCheckedChange={v => set("registrationEnabled", v)} />
                  </div>
                  {data.registrationEnabled && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Registration Opens</Label>
                        <Input type="datetime-local" value={data.registrationStart || ""} onChange={e => set("registrationStart", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Registration Closes</Label>
                        <Input type="datetime-local" value={data.registrationEnd || ""} onChange={e => set("registrationEnd", e.target.value)} />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Maximum Players</Label>
                      <Input type="number" min={1} value={data.capacity || ""} onChange={e => set("capacity", e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Unlimited" />
                    </div>
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <Select value={data.visibility} onValueChange={v => set("visibility", v as EventVisibility)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                          <SelectItem value="HIDDEN">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Waiting List</p>
                      <p className="text-sm text-muted-foreground">Allow participants to join a waitlist when full</p>
                    </div>
                    <Switch checked={data.waitlistEnabled} onCheckedChange={v => set("waitlistEnabled", v)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Featured Event</p>
                      <p className="text-sm text-muted-foreground">Highlight this event in listings</p>
                    </div>
                    <Switch checked={data.isFeatured} onCheckedChange={v => set("isFeatured", v)} />
                  </div>
                </>
              )}

              {/* Step 5: Staff */}
              {step === 5 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Host Name</Label>
                      <Input value={data.hostName || ""} onChange={e => set("hostName", e.target.value)} placeholder="Host display name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Host Discord ID</Label>
                      <Input value={data.hostDiscordId || ""} onChange={e => set("hostDiscordId", e.target.value)} placeholder="Discord user ID" />
                    </div>
                    <div className="space-y-2">
                      <Label>Co-Host Name</Label>
                      <Input value={data.coHostName || ""} onChange={e => set("coHostName", e.target.value)} placeholder="Co-host display name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Co-Host Discord ID</Label>
                      <Input value={data.coHostDiscordId || ""} onChange={e => set("coHostDiscordId", e.target.value)} placeholder="Discord user ID" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Judges</Label>
                    <div className="flex gap-2">
                      <Input value={judgeInput} onChange={e => setJudgeInput(e.target.value)} placeholder="Judge name" onKeyDown={e => e.key === "Enter" && addJudge()} />
                      <Button type="button" variant="outline" onClick={addJudge}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(data.judges || []).map((j, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {j.name}
                          <button onClick={() => setData(p => ({ ...p, judges: p.judges?.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Moderators</Label>
                    <div className="flex gap-2">
                      <Input value={modInput} onChange={e => setModInput(e.target.value)} placeholder="Moderator name" onKeyDown={e => e.key === "Enter" && addMod()} />
                      <Button type="button" variant="outline" onClick={addMod}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(data.moderators || []).map((m, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {m.name}
                          <button onClick={() => setData(p => ({ ...p, moderators: p.moderators?.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 6: Discord */}
              {step === 6 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Announcement Channel ID</Label>
                      <Input value={data.announcementChannelId || ""} onChange={e => set("announcementChannelId", e.target.value)} placeholder="Discord channel ID" />
                    </div>
                    <div className="space-y-2">
                      <Label>Voice Channel ID</Label>
                      <Input value={data.discordVoiceChannelId || ""} onChange={e => set("discordVoiceChannelId", e.target.value)} placeholder="Discord voice channel ID" />
                    </div>
                    <div className="space-y-2">
                      <Label>Stage Channel ID</Label>
                      <Input value={data.discordStageChannelId || ""} onChange={e => set("discordStageChannelId", e.target.value)} placeholder="Discord stage channel ID" />
                    </div>
                    <div className="space-y-2">
                      <Label>Thread ID</Label>
                      <Input value={data.threadId || ""} onChange={e => set("threadId", e.target.value)} placeholder="Discord thread ID" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Role Ping ID</Label>
                      <Input value={data.rolePingId || ""} onChange={e => set("rolePingId", e.target.value)} placeholder="Discord role ID to ping" />
                    </div>
                  </div>
                </>
              )}

              {/* Step 7: Rules & Rewards */}
              {step === 7 && (
                <>
                  <div className="space-y-2">
                    <Label>Rules</Label>
                    <Textarea value={data.rules || ""} onChange={e => set("rules", e.target.value)} placeholder="Event rules and code of conduct..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Requirements</Label>
                    <Textarea value={data.requirements || ""} onChange={e => set("requirements", e.target.value)} placeholder="Participation requirements (rank, account age, etc.)..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Textarea value={data.instructions || ""} onChange={e => set("instructions", e.target.value)} placeholder="How to participate, join links, etc..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rewards Preview</Label>
                    <Textarea value={data.rewardsPreview || ""} onChange={e => set("rewardsPreview", e.target.value)} placeholder="Prizes, badges, points, or other rewards..." rows={3} />
                  </div>

                  {/* Summary */}
                  <Separator />
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Event Summary</h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{data.title || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Festival</span><span>{festivals.find(f => f.id === data.festivalId)?.name || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{categories.find(c => c.id === data.categoryId)?.name || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Start</span><span>{data.startDate ? new Date(data.startDate).toLocaleString() : "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{data.capacity || "Unlimited"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Registration</span><span>{data.registrationEnabled ? "Enabled" : "Disabled"}</span></div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={step === 1 ? () => router.push("/dashboard/admin/events") : handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Step {step} of {STEPS.length}</span>
          {step < 7 ? (
            <Button onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Create Event
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

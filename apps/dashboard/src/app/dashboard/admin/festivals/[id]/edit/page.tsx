"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Save,
  Globe,
  Lock,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Textarea } from "@gameverse/ui/textarea";
import { Label } from "@gameverse/ui/label";
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
import { Separator } from "@gameverse/ui/separator";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  createFestival,
  updateFestival,
  getFestivalById,
} from "../../_actions/festival";
import type { FestivalVisibility, FestivalStatus } from "@gameverse/types";

// =====================================================
// Constants
// =====================================================

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "IST (UTC+5:30)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "EST (UTC-5)" },
  { value: "America/Los_Angeles", label: "PST (UTC-8)" },
  { value: "Europe/London", label: "GMT (UTC+0)" },
  { value: "Asia/Tokyo", label: "JST (UTC+9)" },
];

const VISIBILITY_OPTIONS: { value: FestivalVisibility; label: string; icon: React.ReactNode }[] = [
  { value: "PUBLIC", label: "Public", icon: <Globe className="h-4 w-4" /> },
  { value: "PRIVATE", label: "Private", icon: <Lock className="h-4 w-4" /> },
  { value: "UNLISTED", label: "Unlisted", icon: <EyeOff className="h-4 w-4" /> },
];

const STATUS_OPTIONS: { value: FestivalStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "LIVE", label: "Active / Live" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const PRESET_COLORS = [
  "#5865F2", "#EB459E", "#57F287", "#FEE75C", "#ED4245",
  "#9B59B6", "#E67E22", "#1ABC9C", "#3498DB", "#E74C3C",
];

// =====================================================
// Validation
// =====================================================

interface ValidationErrors {
  name?: string;
  slug?: string;
  startDate?: string;
  endDate?: string;
  registrationStart?: string;
  registrationEnd?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function validateForm(data: {
  name: string; slug: string; startDate: string; endDate: string;
  registrationStart: string; registrationEnd: string; logoUrl: string; bannerUrl: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.name.trim()) errors.name = "Name is required";
  else if (data.name.trim().length < 3) errors.name = "Name must be at least 3 characters";
  if (!data.slug.trim()) errors.slug = "Slug is required";
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug.trim())) errors.slug = "Lowercase letters, numbers, and hyphens only";
  if (!data.startDate) errors.startDate = "Start date is required";
  if (!data.endDate) errors.endDate = "End date is required";
  else if (data.startDate && new Date(data.endDate) <= new Date(data.startDate)) errors.endDate = "End date must be after start date";
  if (data.registrationStart && data.registrationEnd) {
    if (new Date(data.registrationEnd) <= new Date(data.registrationStart)) errors.registrationEnd = "Registration end must be after start";
  }
  if (data.logoUrl && !/^https?:\/\/.+/.test(data.logoUrl)) errors.logoUrl = "Must be a valid URL";
  if (data.bannerUrl && !/^https?:\/\/.+/.test(data.bannerUrl)) errors.bannerUrl = "Must be a valid URL";
  return errors;
}

// =====================================================
// Component
// =====================================================

export default function FestivalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const isCreate = id === "new";

  const [isLoading, setIsLoading] = useState(!isCreate);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [visibility, setVisibility] = useState<FestivalVisibility>("PUBLIC");
  const [status, setStatus] = useState<FestivalStatus>("DRAFT");
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [discordInvite, setDiscordInvite] = useState("");
  const [themeColor, setThemeColor] = useState("#5865F2");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (!isCreate) {
      const fetchFestival = async () => {
        let result = await getFestivalById(id);
        if (result.success && result.data) {
          const f = result.data;
          setName(f.name);
          setSlug(f.slug);
          setShortDescription(f.shortDescription ?? "");
          setFullDescription(f.fullDescription ?? "");
          setStartDate(f.startDate ? new Date(f.startDate).toISOString().slice(0, 16) : "");
          setEndDate(f.endDate ? new Date(f.endDate).toISOString().slice(0, 16) : "");
          setTimezone(f.timezone);
          setVisibility(f.visibility);
          setStatus(f.status);
          setRegistrationEnabled(f.registrationEnabled);
          setRegistrationStart(f.registrationStart ? new Date(f.registrationStart).toISOString().slice(0, 16) : "");
          setRegistrationEnd(f.registrationEnd ? new Date(f.registrationEnd).toISOString().slice(0, 16) : "");
          setBannerUrl(f.bannerUrl ?? "");
          setLogoUrl(f.logoUrl ?? "");
          setDiscordInvite(f.discordInvite ?? "");
          setThemeColor(f.themeColor);
          setSlugManuallyEdited(true);
        } else {
          setGlobalError("Failed to load festival");
        }
        setIsLoading(false);
      };
      fetchFestival();
    }
  }, [id, isCreate]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (!slugManuallyEdited) setSlug(generateSlug(value));
  }, [slugManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const validationErrors = validateForm({ name: name.trim(), slug: slug.trim(), startDate, endDate, registrationStart, registrationEnd, logoUrl, bannerUrl });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription.trim() || undefined,
        fullDescription: fullDescription.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        themeColor,
        discordInvite: discordInvite.trim() || undefined,
        registrationEnabled,
        registrationStart: registrationStart ? new Date(registrationStart).toISOString() : undefined,
        registrationEnd: registrationEnd ? new Date(registrationEnd).toISOString() : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        timezone,
        visibility,
        ...(isCreate ? {} : { status }),
      };

      let result;
      if (isCreate) {
        result = await createFestival(payload);
      } else {
        result = await updateFestival(id, payload);
      }

      if (result.success && result.data) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (isCreate) {
          router.push(`/dashboard/admin/festivals/${result.data.id}`);
        }
      } else {
        setGlobalError(!result.success ? (result.error ?? "Failed to save festival") : "Failed to save festival");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(isCreate ? "/dashboard/admin/festivals" : `/dashboard/admin/festivals/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{isCreate ? "Create Festival" : "Edit Festival"}</h1>
            <p className="text-sm text-muted-foreground">{isCreate ? "Set up a new festival season" : `Editing: ${name}`}</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core festival details and identification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Festival Name <span className="text-destructive">*</span></Label>
                <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="GameVerse Festival 2026" className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                <Input id="slug" value={slug} onChange={(e) => { setSlugManuallyEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} placeholder="gameverse-festival-2026" className={errors.slug ? "border-destructive" : ""} />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input id="shortDescription" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Brief description (max 256 chars)" maxLength={256} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullDescription">Full Description / Rules</Label>
              <Textarea id="fullDescription" value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Full description, rules, and requirements..." rows={5} />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Branding</CardTitle>
            <CardDescription>Visual identity for this festival.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input id="logoUrl" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={errors.logoUrl ? "border-destructive" : ""} />
                {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerUrl">Banner URL</Label>
                <Input id="bannerUrl" type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className={errors.bannerUrl ? "border-destructive" : ""} />
                {errors.bannerUrl && <p className="text-xs text-destructive">{errors.bannerUrl}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Theme Color</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="h-9 w-9 rounded-lg border cursor-pointer" />
                <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-28 font-mono" maxLength={7} />
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setThemeColor(c)} className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${themeColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discordInvite">Discord Invite URL</Label>
              <Input id="discordInvite" type="url" value={discordInvite} onChange={(e) => setDiscordInvite(e.target.value)} placeholder="https://discord.gg/..." />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>Festival dates and registration window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
                <Input id="startDate" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={errors.startDate ? "border-destructive" : ""} />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date <span className="text-destructive">*</span></Label>
                <Input id="endDate" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={errors.endDate ? "border-destructive" : ""} />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Enable Registration</p>
                <p className="text-xs text-muted-foreground">Allow participants to register.</p>
              </div>
              <button type="button" onClick={() => setRegistrationEnabled(!registrationEnabled)} className={`relative h-6 w-11 rounded-full transition-colors ${registrationEnabled ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${registrationEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {registrationEnabled && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registrationStart">Registration Opens</Label>
                  <Input id="registrationStart" type="datetime-local" value={registrationStart} onChange={(e) => setRegistrationStart(e.target.value)} className={errors.registrationStart ? "border-destructive" : ""} />
                  {errors.registrationStart && <p className="text-xs text-destructive">{errors.registrationStart}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationEnd">Registration Closes</Label>
                  <Input id="registrationEnd" type="datetime-local" value={registrationEnd} onChange={(e) => setRegistrationEnd(e.target.value)} className={errors.registrationEnd ? "border-destructive" : ""} />
                  {errors.registrationEnd && <p className="text-xs text-destructive">{errors.registrationEnd}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription>Visibility, status, and access settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as FestivalVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">{opt.icon}{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isCreate && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as FestivalStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(isCreate ? "/dashboard/admin/festivals" : `/dashboard/admin/festivals/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : saved ? "Saved!" : isCreate ? "Create Festival" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

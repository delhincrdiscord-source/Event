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
} from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
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
import { Separator } from "@gameverse/ui/separator";
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  createFestival,
  updateFestival,
  getFestivalById,
} from "../../_actions/festival";
import type {
  CreateFestivalInput,
  UpdateFestivalInput,
  FestivalVisibility,
} from "@gameverse/types";

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
] as const;

const VISIBILITY_OPTIONS: { value: FestivalVisibility; label: string; icon: React.ReactNode }[] = [
  { value: "PUBLIC", label: "Public", icon: <Globe className="h-4 w-4" /> },
  { value: "PRIVATE", label: "Private", icon: <Lock className="h-4 w-4" /> },
  { value: "UNLISTED", label: "Unlisted", icon: <EyeOff className="h-4 w-4" /> },
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
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateForm(data: {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  } else if (data.name.trim().length > 128) {
    errors.name = "Name must be at most 128 characters";
  }

  if (!data.slug.trim()) {
    errors.slug = "Slug is required";
  } else if (data.slug.trim().length < 3) {
    errors.slug = "Slug must be at least 3 characters";
  } else if (data.slug.trim().length > 64) {
    errors.slug = "Slug must be at most 64 characters";
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug.trim())) {
    errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
  }

  if (!data.startDate) {
    errors.startDate = "Start date is required";
  }

  if (!data.endDate) {
    errors.endDate = "End date is required";
  } else if (data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.endDate = "End date must be after start date";
  }

  if (data.registrationStart && data.startDate) {
    if (new Date(data.registrationStart) < new Date(data.startDate)) {
      errors.registrationStart = "Registration start must be on or after the festival start date";
    }
  }

  if (data.registrationStart && data.registrationEnd) {
    if (new Date(data.registrationEnd) <= new Date(data.registrationStart)) {
      errors.registrationEnd = "Registration end must be after registration start";
    }
  }

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

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [visibility, setVisibility] = useState<FestivalVisibility>("PUBLIC");
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [discordInvite, setDiscordInvite] = useState("");
  const [themeColor, setThemeColor] = useState("#7928ca");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (!isCreate) {
      const fetchFestival = async () => {
        const result = await getFestivalById(id);
        if (result.success && result.data) {
          const f = result.data;
          setName(f.name);
          setSlug(f.slug);
          setShortDescription(f.shortDescription ?? "");
          setFullDescription(f.fullDescription ?? "");
          setStartDate(
            f.startDate ? new Date(f.startDate).toISOString().slice(0, 16) : ""
          );
          setEndDate(
            f.endDate ? new Date(f.endDate).toISOString().slice(0, 16) : ""
          );
          setTimezone(f.timezone);
          setVisibility(f.visibility);
          setRegistrationEnabled(f.registrationEnabled);
          setRegistrationStart(
            f.registrationStart
              ? new Date(f.registrationStart).toISOString().slice(0, 16)
              : ""
          );
          setRegistrationEnd(
            f.registrationEnd
              ? new Date(f.registrationEnd).toISOString().slice(0, 16)
              : ""
          );
          setBannerUrl(f.bannerUrl ?? "");
          setLogoUrl(f.logoUrl ?? "");
          setDiscordInvite(f.discordInvite ?? "");
          setThemeColor(f.themeColor);
          setSlugManuallyEdited(true);
        } else {
          setGlobalError(!result.success ? (result.error ?? "Failed to load festival") : "");
        }
        setIsLoading(false);
      };
      fetchFestival();
    }
  }, [id, isCreate]);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!slugManuallyEdited) {
        setSlug(generateSlug(value));
      }
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlugManuallyEdited(true);
    setSlug(value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const formData = {
      name: name.trim(),
      slug: slug.trim(),
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
    };

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    const baseData = {
      name: name.trim(),
      slug: slug.trim(),
      shortDescription: shortDescription.trim() || undefined,
      fullDescription: fullDescription.trim() || undefined,
      startDate,
      endDate,
      timezone: timezone || "Asia/Kolkata",
      visibility: visibility || "PUBLIC",
      registrationEnabled,
      registrationStart: registrationEnabled ? registrationStart || undefined : undefined,
      registrationEnd: registrationEnabled ? registrationEnd || undefined : undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      discordInvite: discordInvite.trim() || undefined,
      themeColor,
    };

    try {
      let result;
      if (isCreate) {
        result = await createFestival(baseData as unknown as CreateFestivalInput);
      } else {
        result = await updateFestival(id, baseData as unknown as UpdateFestivalInput);
      }

      if (result.success) {
        router.push("/dashboard/admin/festivals");
      } else {
        setGlobalError(!result.success ? (result.error ?? "Failed to save festival") : "");
      }
    } catch {
      setGlobalError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================
  // Loading Skeleton
  // =====================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/admin/festivals")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isCreate ? "Create Festival" : "Edit Festival"}
          </h1>
          <p className="text-sm text-[#888888]">
            {isCreate
              ? "Set up a new gaming festival"
              : "Update festival details and settings"}
          </p>
        </div>
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="flex items-center gap-2 rounded-lg border border-[#ee0000] bg-[#f7d4d6] p-4 text-sm text-[#c50000]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* ===================================================== */}
          {/* Basic Information */}
          {/* ===================================================== */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                  <span className="text-sm font-semibold text-[#171717]">1</span>
                </div>
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Name, slug, and description</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Festival Name"
                placeholder="e.g. GameVerse Festival 2026"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                error={errors.name}
              />

              <Input
                label="Slug"
                placeholder="e.g. gameverse-festival-2026"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                error={errors.slug}
                helperText={
                  !errors.slug
                    ? "Auto-generated from name. Used in URLs."
                    : undefined
                }
              />

              <div className="w-full">
                <label
                  htmlFor="short-description"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Short Description
                </label>
                <Input
                  id="short-description"
                  placeholder="A brief summary of the festival"
                  value={shortDescription}
                  onChange={(e) => {
                    if (e.target.value.length <= 256) {
                      setShortDescription(e.target.value);
                    }
                  }}
                  helperText={`${shortDescription.length}/256 characters`}
                />
              </div>

              <div className="w-full">
                <label
                  htmlFor="full-description"
                  className="block text-sm font-medium text-[#171717] mb-1.5"
                >
                  Full Description
                </label>
                <Textarea
                  id="full-description"
                  placeholder="Detailed description of the festival..."
                  rows={5}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ===================================================== */}
          {/* Schedule */}
          {/* ===================================================== */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                  <span className="text-sm font-semibold text-[#171717]">2</span>
                </div>
                <div>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>Dates, timezone, and visibility</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Start Date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                error={errors.startDate}
              />

              <Input
                label="End Date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                error={errors.endDate}
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-[#171717] mb-1.5">
                  Timezone
                </label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
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

              <Separator />

              <div className="w-full">
                <label className="block text-sm font-medium text-[#171717] mb-1.5">
                  Visibility
                </label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as FestivalVisibility)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          {opt.icon}
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ===================================================== */}
          {/* Registration */}
          {/* ===================================================== */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                  <span className="text-sm font-semibold text-[#171717]">3</span>
                </div>
                <div>
                  <CardTitle>Registration</CardTitle>
                  <CardDescription>Configure registration settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-[#ebebeb] p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-[#171717]">
                    Enable Registration
                  </p>
                  <p className="text-sm text-[#888888]">
                    Allow participants to register for this festival
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={registrationEnabled}
                  onClick={() => setRegistrationEnabled(!registrationEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2 ${
                    registrationEnabled ? "bg-[#171717]" : "bg-[#ebebeb]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      registrationEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {registrationEnabled && (
                <>
                  <Separator />
                  <Input
                    label="Registration Start"
                    type="datetime-local"
                    value={registrationStart}
                    onChange={(e) => setRegistrationStart(e.target.value)}
                    error={errors.registrationStart}
                    helperText={
                      !errors.registrationStart
                        ? "Must be on or after the festival start date"
                        : undefined
                    }
                  />
                  <Input
                    label="Registration End"
                    type="datetime-local"
                    value={registrationEnd}
                    onChange={(e) => setRegistrationEnd(e.target.value)}
                    error={errors.registrationEnd}
                    helperText={
                      !errors.registrationEnd
                        ? "Must be after registration start"
                        : undefined
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* ===================================================== */}
          {/* Media & Links */}
          {/* ===================================================== */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fafafa]">
                  <span className="text-sm font-semibold text-[#171717]">4</span>
                </div>
                <div>
                  <CardTitle>Media & Links</CardTitle>
                  <CardDescription>Images, links, and theming</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Banner URL"
                placeholder="https://example.com/banner.jpg"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                helperText="Recommended: 1920x600px"
              />

              <Input
                label="Logo URL"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                helperText="Recommended: 512x512px"
              />

              <Input
                label="Discord Invite"
                placeholder="https://discord.gg/..."
                value={discordInvite}
                onChange={(e) => setDiscordInvite(e.target.value)}
              />

              <Separator />

              <div className="w-full">
                <label className="block text-sm font-medium text-[#171717] mb-1.5">
                  Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-md border border-[#ebebeb] p-0.5"
                  />
                  <Input
                    placeholder="#7928ca"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-32"
                  />
                  <div
                    className="h-10 w-10 rounded-full border border-[#ebebeb]"
                    style={{ backgroundColor: themeColor }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===================================================== */}
        {/* Actions */}
        {/* ===================================================== */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/admin/festivals")}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isCreate ? "Create Festival" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Info,
  Globe,
  Lock,
  EyeOff,
  AlertCircle,
  Palette,
  Calendar,
  Settings2,
  FileText,
  Sparkles,
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

import { createFestival } from "../_actions/festival";
import type { FestivalVisibility } from "@gameverse/types";

// =====================================================
// Wizard Steps
// =====================================================

const STEPS = [
  { id: 1, title: "Basic Info", description: "Name, season & description", icon: <FileText className="h-4 w-4" /> },
  { id: 2, title: "Branding", description: "Logo, banner & theme", icon: <Palette className="h-4 w-4" /> },
  { id: 3, title: "Schedule", description: "Dates & registration window", icon: <Calendar className="h-4 w-4" /> },
  { id: 4, title: "Configuration", description: "Participants & rules", icon: <Settings2 className="h-4 w-4" /> },
  { id: 5, title: "Rules", description: "Terms & requirements", icon: <FileText className="h-4 w-4" /> },
];

// =====================================================
// Form State
// =====================================================

interface WizardFormState {
  // Step 1
  name: string;
  season: string;
  slug: string;
  shortDescription: string;
  // Step 2
  logoUrl: string;
  bannerUrl: string;
  themeColor: string;
  // Step 3
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  timezone: string;
  // Step 4
  maxParticipants: string;
  registrationEnabled: boolean;
  visibility: FestivalVisibility;
  leaderboardType: string;
  registrationType: string;
  // Step 5
  fullDescription: string;
  terms: string;
  requirements: string;
}

const initialState: WizardFormState = {
  name: "",
  season: "",
  slug: "",
  shortDescription: "",
  logoUrl: "",
  bannerUrl: "",
  themeColor: "#5865F2",
  startDate: "",
  endDate: "",
  registrationStart: "",
  registrationEnd: "",
  timezone: "Asia/Kolkata",
  maxParticipants: "",
  registrationEnabled: false,
  visibility: "PUBLIC",
  leaderboardType: "POINTS",
  registrationType: "OPEN",
  fullDescription: "",
  terms: "",
  requirements: "",
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =====================================================
// Step Components
// =====================================================

interface StepProps {
  form: WizardFormState;
  onChange: (field: keyof WizardFormState, value: string | boolean) => void;
  errors: Partial<Record<keyof WizardFormState, string>>;
}

function Step1BasicInfo({ form, onChange, errors }: StepProps) {
  const handleNameChange = (value: string) => {
    onChange("name", value);
    if (!form.slug || form.slug === generateSlug(form.name)) {
      onChange("slug", generateSlug(value));
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">
          Festival Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. GameVerse Festival 2026"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="season">Season</Label>
        <Input
          id="season"
          placeholder="e.g. Season 1, Spring 2026"
          value={form.season}
          onChange={(e) => onChange("season", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Optional season identifier for this festival.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">festival/</span>
          <Input
            id="slug"
            placeholder="gameverse-festival-2026"
            value={form.slug}
            onChange={(e) => onChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className={errors.slug ? "border-destructive" : ""}
          />
        </div>
        {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
        <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description</Label>
        <Textarea
          id="shortDescription"
          placeholder="A brief description of this festival season..."
          value={form.shortDescription}
          onChange={(e) => onChange("shortDescription", e.target.value)}
          rows={3}
          maxLength={256}
        />
        <p className="text-xs text-muted-foreground text-right">{form.shortDescription.length}/256</p>
      </div>
    </div>
  );
}

function Step2Branding({ form, onChange, errors }: StepProps) {
  const PRESET_COLORS = [
    "#5865F2", "#EB459E", "#57F287", "#FEE75C", "#ED4245",
    "#9B59B6", "#E67E22", "#1ABC9C", "#3498DB", "#E74C3C",
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Festival Logo URL</Label>
        <Input
          id="logoUrl"
          type="url"
          placeholder="https://example.com/logo.png"
          value={form.logoUrl}
          onChange={(e) => onChange("logoUrl", e.target.value)}
          className={errors.logoUrl ? "border-destructive" : ""}
        />
        {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl}</p>}
        {form.logoUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img src={form.logoUrl} alt="Logo preview" className="h-12 w-12 rounded-lg object-cover border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <p className="text-xs text-muted-foreground">Logo preview</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bannerUrl">Festival Banner URL</Label>
        <Input
          id="bannerUrl"
          type="url"
          placeholder="https://example.com/banner.jpg"
          value={form.bannerUrl}
          onChange={(e) => onChange("bannerUrl", e.target.value)}
          className={errors.bannerUrl ? "border-destructive" : ""}
        />
        {errors.bannerUrl && <p className="text-xs text-destructive">{errors.bannerUrl}</p>}
        {form.bannerUrl && (
          <div className="mt-2 overflow-hidden rounded-lg border h-24">
            <img src={form.bannerUrl} alt="Banner preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Theme Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.themeColor}
            onChange={(e) => onChange("themeColor", e.target.value)}
            className="h-10 w-10 rounded-lg border cursor-pointer"
          />
          <Input
            value={form.themeColor}
            onChange={(e) => onChange("themeColor", e.target.value)}
            placeholder="#5865F2"
            className="w-32 font-mono"
            maxLength={7}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange("themeColor", color)}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${form.themeColor === color ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>
        <div
          className="h-10 w-full rounded-lg border flex items-center justify-center text-white text-sm font-medium"
          style={{ background: form.themeColor }}
        >
          Preview: {form.name || "Festival Name"}
        </div>
      </div>
    </div>
  );
}

function Step3Schedule({ form, onChange, errors }: StepProps) {
  const TIMEZONE_OPTIONS = [
    { value: "Asia/Kolkata", label: "IST (UTC+5:30)" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "EST (UTC-5)" },
    { value: "America/Los_Angeles", label: "PST (UTC-8)" },
    { value: "Europe/London", label: "GMT (UTC+0)" },
    { value: "Asia/Tokyo", label: "JST (UTC+9)" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className={errors.startDate ? "border-destructive" : ""}
          />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">
            End Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            className={errors.endDate ? "border-destructive" : ""}
          />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
        </div>
      </div>

      <Separator />

      <div className="space-y-1">
        <h4 className="text-sm font-medium">Registration Window</h4>
        <p className="text-xs text-muted-foreground">Set when participants can register for this festival.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registrationStart">Registration Opens</Label>
          <Input
            id="registrationStart"
            type="datetime-local"
            value={form.registrationStart}
            onChange={(e) => onChange("registrationStart", e.target.value)}
            className={errors.registrationStart ? "border-destructive" : ""}
          />
          {errors.registrationStart && <p className="text-xs text-destructive">{errors.registrationStart}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationEnd">Registration Closes</Label>
          <Input
            id="registrationEnd"
            type="datetime-local"
            value={form.registrationEnd}
            onChange={(e) => onChange("registrationEnd", e.target.value)}
            className={errors.registrationEnd ? "border-destructive" : ""}
          />
          {errors.registrationEnd && <p className="text-xs text-destructive">{errors.registrationEnd}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={form.timezone} onValueChange={(v) => onChange("timezone", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Step4Configuration({ form, onChange, errors }: StepProps) {
  const VISIBILITY_OPTIONS = [
    { value: "PUBLIC", label: "Public", description: "Visible to everyone", icon: <Globe className="h-4 w-4" /> },
    { value: "PRIVATE", label: "Private", description: "Invite only", icon: <Lock className="h-4 w-4" /> },
    { value: "UNLISTED", label: "Unlisted", description: "Link access only", icon: <EyeOff className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="maxParticipants">Maximum Participants</Label>
        <Input
          id="maxParticipants"
          type="number"
          min="1"
          placeholder="e.g. 500 (leave empty for unlimited)"
          value={form.maxParticipants}
          onChange={(e) => onChange("maxParticipants", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Leave empty for unlimited participants.</p>
      </div>

      <div className="space-y-2">
        <Label>Leaderboard Type</Label>
        <Select value={form.leaderboardType} onValueChange={(v) => onChange("leaderboardType", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POINTS">Points Based</SelectItem>
            <SelectItem value="WINS">Win Count</SelectItem>
            <SelectItem value="COMBINED">Combined Score</SelectItem>
            <SelectItem value="ATTENDANCE">Attendance Based</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Registration Type</Label>
        <Select value={form.registrationType} onValueChange={(v) => onChange("registrationType", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open Registration</SelectItem>
            <SelectItem value="APPROVAL">Approval Required</SelectItem>
            <SelectItem value="INVITE">Invite Only</SelectItem>
            <SelectItem value="WAITLIST">Waitlist Enabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Visibility</Label>
        <div className="grid gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange("visibility", opt.value as FestivalVisibility)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                form.visibility === opt.value
                  ? "border-primary bg-primary/5" :"border-border hover:border-border/80 hover:bg-muted/50"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-md ${form.visibility === opt.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {opt.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {form.visibility === opt.value && (
                <Check className="ml-auto h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="flex-1">
          <p className="text-sm font-medium">Enable Registration</p>
          <p className="text-xs text-muted-foreground">Allow participants to register for this festival.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange("registrationEnabled", !form.registrationEnabled)}
          className={`relative h-6 w-11 rounded-full transition-colors ${form.registrationEnabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.registrationEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

function Step5Rules({ form, onChange, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullDescription">Festival Rules</Label>
        <Textarea
          id="fullDescription"
          placeholder="Describe the rules and guidelines for this festival..."
          value={form.fullDescription}
          onChange={(e) => onChange("fullDescription", e.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms">Terms & Conditions</Label>
        <Textarea
          id="terms"
          placeholder="Terms and conditions participants must agree to..."
          value={form.terms}
          onChange={(e) => onChange("terms", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea
          id="requirements"
          placeholder="List any requirements participants must meet (e.g. Discord account, minimum age)..."
          value={form.requirements}
          onChange={(e) => onChange("requirements", e.target.value)}
          rows={4}
        />
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-400">
          <p className="font-medium">Almost done!</p>
          <p className="text-xs mt-0.5 text-blue-400/80">Review your festival details before creating. You can always edit these later.</p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Validation
// =====================================================

function validateStep(step: number, form: WizardFormState): Partial<Record<keyof WizardFormState, string>> {
  const errors: Partial<Record<keyof WizardFormState, string>> = {};

  if (step === 1) {
    if (!form.name.trim()) errors.name = "Festival name is required";
    else if (form.name.trim().length < 3) errors.name = "Name must be at least 3 characters";
    if (!form.slug.trim()) errors.slug = "Slug is required";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) errors.slug = "Slug must be lowercase letters, numbers, and hyphens";
  }

  if (step === 2) {
    if (form.logoUrl && !/^https?:\/\/.+/.test(form.logoUrl)) errors.logoUrl = "Must be a valid URL";
    if (form.bannerUrl && !/^https?:\/\/.+/.test(form.bannerUrl)) errors.bannerUrl = "Must be a valid URL";
  }

  if (step === 3) {
    if (!form.startDate) errors.startDate = "Start date is required";
    if (!form.endDate) errors.endDate = "End date is required";
    else if (form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
      errors.endDate = "End date must be after start date";
    }
    if (form.registrationStart && form.registrationEnd) {
      if (new Date(form.registrationEnd) <= new Date(form.registrationStart)) {
        errors.registrationEnd = "Registration end must be after registration start";
      }
    }
  }

  return errors;
}

// =====================================================
// Main Wizard Component
// =====================================================

export default function NewFestivalPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardFormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleChange = useCallback((field: keyof WizardFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(currentStep, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setGlobalError(null);
    startTransition(async () => {
      const result = await createFestival({
        name: form.name.trim(),
        slug: form.slug.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        fullDescription: [form.fullDescription, form.terms, form.requirements]
          .filter(Boolean)
          .join("\n\n---\n\n") || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        bannerUrl: form.bannerUrl.trim() || undefined,
        themeColor: form.themeColor,
        registrationEnabled: form.registrationEnabled,
        registrationStart: form.registrationStart ? new Date(form.registrationStart).toISOString() : undefined,
        registrationEnd: form.registrationEnd ? new Date(form.registrationEnd).toISOString() : undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        timezone: form.timezone,
        visibility: form.visibility,
      });

      if (result.success && result.data) {
        router.push(`/dashboard/admin/festivals/${result.data.id}`);
      } else {
        setGlobalError(!result.success ? (result.error ?? "Failed to create festival") : "Failed to create festival");
      }
    });
  };

  const stepProps: StepProps = { form, onChange: handleChange, errors };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin/festivals")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Festival
          </h1>
          <p className="text-sm text-muted-foreground">Set up a new GameVerse Festival season</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => {
                if (step.id < currentStep) setCurrentStep(step.id);
              }}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all ${
                step.id === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.id < currentStep
                  ? "border-primary bg-primary/10 text-primary cursor-pointer hover:bg-primary/20" :"border-border bg-muted text-muted-foreground"
              }`}
            >
              {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 transition-colors ${step.id < currentStep ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between px-0">
        {STEPS.map((step) => (
          <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / STEPS.length}%` }}>
            <p className={`text-xs font-medium text-center ${step.id === currentStep ? "text-foreground" : "text-muted-foreground"}`}>
              {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {STEPS[currentStep - 1]?.icon}
            </div>
            <div>
              <CardTitle className="text-base">{STEPS[currentStep - 1]?.title}</CardTitle>
              <CardDescription className="text-xs">{STEPS[currentStep - 1]?.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && <Step1BasicInfo {...stepProps} />}
              {currentStep === 2 && <Step2Branding {...stepProps} />}
              {currentStep === 3 && <Step3Schedule {...stepProps} />}
              {currentStep === 4 && <Step4Configuration {...stepProps} />}
              {currentStep === 5 && <Step5Rules {...stepProps} />}
            </motion.div>
          </AnimatePresence>

          {globalError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {globalError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Festival
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

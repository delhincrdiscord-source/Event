"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Eye, EyeOff, Clock, CheckCircle2, History, Settings, Pencil, Copy, Trash2, Type, AlignLeft, Mail, Hash, Phone, MessageSquare, Gamepad2, User, ChevronDown, CheckSquare, Check, Circle, Calendar, Globe, Upload, Link, Heading, Minus,  } from "lucide-react";

import { Button } from "@gameverse/ui/button";

import { Label } from "@gameverse/ui/label";
import { Badge } from "@gameverse/ui/badge";
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
import { Skeleton } from "@gameverse/ui/skeleton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gameverse/ui/dialog";

import { getFormFields, deleteFormField, duplicateFormField, getFormStats, getFormVersions,  } from "./_actions/form-builder";
import { getAllFestivals } from "../festivals/_actions/festival";
import { getEvents } from "../events/_actions/event";

import { FormPreview } from "./_components/form-preview";

import type { FormFieldConfig, FormStats, FormVersionListItem, FestivalListItem, CommunityEventListItem,  } from "@gameverse/types";
import {
  FORM_FIELD_TYPE_LABELS,
  FORM_FIELD_TYPE_ICONS,
  FORM_STATUS_LABELS,
  FORM_STATUS_COLORS,
} from "@gameverse/types";

const ICON_MAP: Record<string, React.ReactNode> = {
  Type: <Type className="h-4 w-4" />,
  AlignLeft: <AlignLeft className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  Hash: <Hash className="h-4 w-4" />,
  Phone: <Phone className="h-4 w-4" />,
  MessageSquare: <MessageSquare className="h-4 w-4" />,
  Gamepad2: <Gamepad2 className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
  ChevronDown: <ChevronDown className="h-4 w-4" />,
  CheckSquare: <CheckSquare className="h-4 w-4" />,
  Check: <Check className="h-4 w-4" />,
  Circle: <Circle className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  Link: <Link className="h-4 w-4" />,
  Heading: <Heading className="h-4 w-4" />,
  Minus: <Minus className="h-4 w-4" />,
};

const FIELD_TYPE_COLORS: Record<string, string> = {
  SHORT_TEXT: "bg-blue-100 text-blue-800",
  LONG_TEXT: "bg-indigo-100 text-indigo-800",
  EMAIL: "bg-purple-100 text-purple-800",
  NUMBER: "bg-cyan-100 text-cyan-800",
  PHONE: "bg-teal-100 text-teal-800",
  DISCORD_USERNAME: "bg-violet-100 text-violet-800",
  DISCORD_USER_ID: "bg-violet-100 text-violet-800",
  GAME_UID: "bg-emerald-100 text-emerald-800",
  IGN: "bg-amber-100 text-amber-800",
  SELECT: "bg-orange-100 text-orange-800",
  MULTI_SELECT: "bg-orange-100 text-orange-800",
  CHECKBOX: "bg-rose-100 text-rose-800",
  RADIO: "bg-pink-100 text-pink-800",
  DATE: "bg-sky-100 text-sky-800",
  TIME: "bg-sky-100 text-sky-800",
  COUNTRY: "bg-green-100 text-green-800",
  FILE_UPLOAD: "bg-slate-100 text-slate-800",
  URL: "bg-blue-100 text-blue-800",
  SECTION_HEADER: "bg-gray-100 text-gray-800",
  DIVIDER: "bg-gray-100 text-gray-800",
  PARAGRAPH: "bg-gray-100 text-gray-800",
};

export default function FormBuilderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [festivals, setFestivals] = useState<FestivalListItem[]>([]);
  const [events, setEvents] = useState<CommunityEventListItem[]>([]);
  const [selectedFestivalId, setSelectedFestivalId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [versions, setVersions] = useState<FormVersionListItem[]>([]);

  const [isLoadingFestivals, setIsLoadingFestivals] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const [deleteDialogField, setDeleteDialogField] = useState<FormFieldConfig | null>(null);

  const loadFestivals = useCallback(async () => {
    setIsLoadingFestivals(true);
    try {
      const result = await getAllFestivals();
      if (result.success && result.data) {
        setFestivals(result.data);
      }
    } finally {
      setIsLoadingFestivals(false);
    }
  }, []);

  const loadEvents = useCallback(async (festivalId: string) => {
    setIsLoadingEvents(true);
    try {
      const result = await getEvents({
        festivalId,
        page: 1,
        perPage: 100,
        sortBy: "startDate",
        sortOrder: "asc",
      });
      if (result.success && result.data) {
        setEvents(result.data.events);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const loadEventData = useCallback(async (eventId: string) => {
    setIsLoadingFields(true);
    try {
      const [fieldsResult, statsResult, versionsResult] = await Promise.all([
        getFormFields(eventId),
        getFormStats(eventId),
        getFormVersions(eventId),
      ]);

      if (fieldsResult.success && fieldsResult.data) {
        const sorted = [...fieldsResult.data].sort(
          (a, b) => a.displayOrder - b.displayOrder
        );
        setFields(sorted);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (versionsResult.success && versionsResult.data) {
        setVersions(versionsResult.data);
      }
    } finally {
      setIsLoadingFields(false);
    }
  }, []);

  useEffect(() => {
    loadFestivals();
  }, [loadFestivals]);

  useEffect(() => {
    if (selectedFestivalId) {
      loadEvents(selectedFestivalId);
      setSelectedEventId("");
      setFields([]);
      setStats(null);
      setVersions([]);
    }
  }, [selectedFestivalId, loadEvents]);

  useEffect(() => {
    if (selectedEventId) {
      loadEventData(selectedEventId);
    }
  }, [selectedEventId, loadEventData]);

  const handleDeleteField = useCallback(
    async (id: string) => {
      const result = await deleteFormField(id);
      if (result.success) {
        setFields((prev) => prev.filter((f) => f.id !== id));
        setDeleteDialogField(null);
        if (selectedEventId) {
          const statsResult = await getFormStats(selectedEventId);
          if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
          }
        }
      }
    },
    [selectedEventId]
  );

  const handleDuplicateField = useCallback(
    async (id: string) => {
      const result = await duplicateFormField(id);
      if (result.success && result.data) {
        setFields((prev) => [...prev, result.data]);
        if (selectedEventId) {
          const statsResult = await getFormStats(selectedEventId);
          if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
          }
        }
      }
    },
    [selectedEventId]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Builder</h1>
          <p className="text-muted-foreground">
            Design and manage registration forms for your events
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Selection</CardTitle>
          <CardDescription>
            Select a festival and event to manage its registration form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label className="text-sm">Festival</Label>
              <Select
                value={selectedFestivalId}
                onValueChange={setSelectedFestivalId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a festival" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingFestivals ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : festivals.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No festivals found
                    </SelectItem>
                  ) : (
                    festivals.map((festival) => (
                      <SelectItem key={festival.id} value={festival.id}>
                        {festival.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label className="text-sm">Event</Label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                disabled={!selectedFestivalId || isLoadingEvents}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingEvents ? "Loading events..." : "Select an event"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEvents ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : events.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No events found
                    </SelectItem>
                  ) : (
                    events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-[var(--ds-gray-100)] p-4 dark:bg-[var(--ds-gray-800)]">
              <Settings className="h-8 w-8 text-[var(--ds-gray-400)]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              Select an event to get started
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a festival and event above to manage its registration form
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Fields
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalFields}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Fields
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeFields}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Responses
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalResponses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Published Versions
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.publishedVersions}</div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>
                    Manage the fields in your event registration form
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className="gap-1.5"
                  >
                    <History className="h-3.5 w-3.5" />
                    Version History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="gap-1.5"
                  >
                    {showPreview ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {showPreview ? "Edit" : "Preview"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/form-builder/${selectedEventId}`)
                    }
                    className="gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Open Builder
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFields ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-4 rounded-lg border p-4"
                    >
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              ) : showPreview ? (
                <FormPreview fields={fields} />
              ) : fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No fields yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Open the form builder to start adding fields
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() =>
                      router.push(`/dashboard/form-builder/${selectedEventId}`)
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Open Builder
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 rounded-lg border bg-muted/50 px-4 py-2">
                    <span className="w-8 text-sm font-medium">#</span>
                    <span className="flex-1 text-sm font-medium">Label</span>
                    <span className="w-[120px] text-sm font-medium">Type</span>
                    <span className="w-[80px] text-sm font-medium">Required</span>
                    <span className="w-[100px] text-sm font-medium">Actions</span>
                  </div>

                  <AnimatePresence>
                    {fields.map((field, index) => {
                      const iconName = FORM_FIELD_TYPE_ICONS[field.fieldType];
                      const icon = ICON_MAP[iconName] || (
                        <Type className="h-4 w-4" />
                      );

                      return (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                        >
                          <span className="w-8 text-sm text-muted-foreground">
                            {field.displayOrder}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--ds-gray-500)]">
                                {icon}
                              </span>
                              <span className="truncate font-medium">
                                {field.label}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {field.fieldName}
                            </p>
                          </div>
                          <span className="w-[120px]">
                            <Badge
                              variant="outline"
                              className={`${FIELD_TYPE_COLORS[field.fieldType]} text-xs`}
                            >
                              {FORM_FIELD_TYPE_LABELS[field.fieldType]}
                            </Badge>
                          </span>
                          <span className="w-[80px]">
                            {field.isRequired ? (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Optional
                              </Badge>
                            )}
                          </span>
                          <div className="w-[100px] flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                router.push(
                                  `/dashboard/form-builder/${selectedEventId}`
                                )
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDuplicateField(field.id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteDialogField(field)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          <AnimatePresence>
            {showVersionHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Version History</CardTitle>
                        <CardDescription>
                          Published and draft versions of this form
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVersionHistory(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {versions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No versions saved yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {versions.map((version) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">
                                v{version.version}
                              </span>
                              <Badge
                                className={`${FORM_STATUS_COLORS[version.status]} text-xs`}
                              >
                                {FORM_STATUS_LABELS[version.status]}
                              </Badge>
                              {version.publishedAt && (
                                <span className="text-xs text-muted-foreground">
                                  Published{" "}
                                  {new Date(
                                    version.publishedAt
                                  ).toLocaleDateString("en-IN")}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Created{" "}
                                {new Date(
                                  version.createdAt
                                ).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {version._count?.responses !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {version._count.responses} responses
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <Dialog
        open={!!deleteDialogField}
        onOpenChange={(open) => !open && setDeleteDialogField(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialogField?.label}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogField(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialogField) {
                  handleDeleteField(deleteDialogField.id);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

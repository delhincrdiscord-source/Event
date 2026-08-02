"use client";

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Upload,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Badge } from "@gameverse/ui/badge";
import { Separator } from "@gameverse/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gameverse/ui/dialog";

import {
  getFormFields,
  createFormField,
  updateFormField,
  deleteFormField,
  reorderFormFields,
  duplicateFormField,
  saveFormVersion,
  publishFormVersion,
  unpublishFormVersion,
} from "../_actions/form-builder";
import { getEventById } from "../../events/_actions/event";

import { FieldPalette } from "../_components/field-palette";
import { FormCanvas } from "../_components/form-canvas";
import { FieldProperties } from "../_components/field-properties";
import { FormPreview } from "../_components/form-preview";

import type { FormFieldConfig, FormFieldType, CreateFormFieldInput, UpdateFormFieldInput } from "@gameverse/types";
import { FORM_FIELD_TYPE_LABELS } from "@gameverse/types";
import { logger } from "@/lib/logger";

interface FormState {
  fields: FormFieldConfig[];
  selectedFieldId: string | null;
}

type FormAction =
  | { type: "SET_FIELDS"; fields: FormFieldConfig[] }
  | { type: "SELECT_FIELD"; id: string | null }
  | { type: "ADD_FIELD"; field: FormFieldConfig }
  | { type: "UPDATE_FIELD"; id: string; data: UpdateFormFieldInput }
  | { type: "REMOVE_FIELD"; id: string }
  | { type: "REORDER"; fields: FormFieldConfig[] }
  | { type: "REPLACE_FIELDS"; fields: FormFieldConfig[] };

interface HistoryEntry {
  fields: FormFieldConfig[];
  selectedFieldId: string | null;
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELDS":
      return { ...state, fields: action.fields };
    case "SELECT_FIELD":
      return { ...state, selectedFieldId: action.id };
    case "ADD_FIELD":
      return {
        ...state,
        fields: [...state.fields, action.field],
        selectedFieldId: action.field.id,
      };
    case "UPDATE_FIELD":
      return {
        ...state,
        fields: state.fields.map((f) =>
          f.id === action.id ? { ...f, ...action.data } : f
        ),
      };
    case "REMOVE_FIELD":
      return {
        ...state,
        fields: state.fields.filter((f) => f.id !== action.id),
        selectedFieldId:
          state.selectedFieldId === action.id ? null : state.selectedFieldId,
      };
    case "REORDER":
      return { ...state, fields: action.fields };
    case "REPLACE_FIELDS":
      return {
        fields: action.fields,
        selectedFieldId: null,
      };
    default:
      return state;
  }
}

export default function FormBuilderEditorPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [formState, dispatch] = useReducer(formReducer, {
    fields: [],
    selectedFieldId: null,
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteDialogField, setDeleteDialogField] = useState<FormFieldConfig | null>(null);
  const [eventName, setEventName] = useState("");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pushHistory = useCallback(
    (fields: FormFieldConfig[], selectedFieldId: string | null) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({ fields: [...fields], selectedFieldId });
        return newHistory.slice(-50);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const entry = history[historyIndex - 1]!;
    dispatch({ type: "REPLACE_FIELDS", fields: entry.fields });
    dispatch({ type: "SELECT_FIELD", id: entry.selectedFieldId });
    setHistoryIndex((prev) => prev - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1]!;
    dispatch({ type: "REPLACE_FIELDS", fields: entry.fields });
    dispatch({ type: "SELECT_FIELD", id: entry.selectedFieldId });
    setHistoryIndex((prev) => prev + 1);
  }, [history, historyIndex]);

  const loadFields = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fieldsResult, eventResult] = await Promise.all([
        getFormFields(eventId),
        getEventById(eventId),
      ]);

      if (fieldsResult.success && fieldsResult.data) {
        const sorted = [...fieldsResult.data].sort(
          (a, b) => a.displayOrder - b.displayOrder
        );
        dispatch({ type: "SET_FIELDS", fields: sorted });
        setHistory([{ fields: sorted, selectedFieldId: null }]);
        setHistoryIndex(0);
      }

      if (eventResult.success && eventResult.data) {
        setEventName(eventResult.data.title);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    if (formState.fields.length > 0) {
      setHasChanges(true);
    }
  }, [formState.fields]);

  useEffect(() => {
    if (hasChanges && !isSaving) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(async () => {
        setAutoSaveStatus("saving");
        try {
          const result = await saveFormVersion({ eventId, fields: [] });
          if (result.success) {
            setAutoSaveStatus("saved");
            setTimeout(() => setAutoSaveStatus("idle"), 2000);
          } else {
            setAutoSaveStatus("error");
          }
        } catch {
          setAutoSaveStatus("error");
        }
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formState.fields, hasChanges, isSaving, eventId]);

  const handleAddField = useCallback(
    async (type: FormFieldType) => {
      const label = FORM_FIELD_TYPE_LABELS[type] || "New Field";
      const fieldName = `${type.toLowerCase()}_${Date.now()}`;

      const input: CreateFormFieldInput = {
        fieldName,
        label,
        fieldType: type,
        isRequired: false,
        displayOrder: formState.fields.length + 1,
      };

      if (["SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"].includes(type)) {
        input.options = [
          { label: "Option 1", value: "option_1" },
          { label: "Option 2", value: "option_2" },
        ];
      }

      const result = await createFormField(eventId, input);
      if (result.success && result.data) {
        dispatch({ type: "ADD_FIELD", field: result.data });
        pushHistory(
          [...formState.fields, result.data],
          result.data.id
        );
      }
    },
    [eventId, formState.fields, pushHistory]
  );

  const handleSelectField = useCallback(
    (id: string) => {
      dispatch({ type: "SELECT_FIELD", id });
    },
    []
  );

  const handleUpdateField = useCallback(
    async (data: UpdateFormFieldInput) => {
      if (!formState.selectedFieldId) return;

      dispatch({
        type: "UPDATE_FIELD",
        id: formState.selectedFieldId,
        data,
      });

      const result = await updateFormField(formState.selectedFieldId, data);
      if (!result.success) {
        logger.error({ err: result.error }, "Failed to update field");
      }
    },
    [formState.selectedFieldId]
  );

  const handleDeleteField = useCallback(
    async (id: string) => {
      const result = await deleteFormField(id);
      if (result.success) {
        dispatch({ type: "REMOVE_FIELD", id });
        pushHistory(
          formState.fields.filter((f) => f.id !== id),
          null
        );
        setDeleteDialogField(null);
      }
    },
    [formState.fields, pushHistory]
  );

  const handleDuplicateField = useCallback(
    async (id: string) => {
      const result = await duplicateFormField(id);
      if (result.success && result.data) {
        dispatch({ type: "ADD_FIELD", field: result.data });
        pushHistory(
          [...formState.fields, result.data],
          result.data.id
        );
      }
    },
    [formState.fields, pushHistory]
  );

  const handleReorder = useCallback(
    async (reorderedFields: FormFieldConfig[]) => {
      dispatch({ type: "REORDER", fields: reorderedFields });
      pushHistory(reorderedFields, formState.selectedFieldId);

      const fieldOrders = reorderedFields.map((f, idx) => ({
        id: f.id,
        displayOrder: idx + 1,
      }));
      await reorderFormFields({ fieldOrders });
    },
    [formState.selectedFieldId, pushHistory]
  );

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await saveFormVersion({ eventId, fields: [] });
      if (result.success) {
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [eventId]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const versionResult = await saveFormVersion({ eventId, fields: [] });
      if (versionResult.success && versionResult.data) {
        const publishResult = await publishFormVersion(versionResult.data.id);
        if (publishResult.success) {
          setAutoSaveStatus("saved");
        }
      }
    } finally {
      setIsPublishing(false);
    }
  }, [eventId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, handleSaveDraft]);

  const selectedField = formState.fields.find(
    (f) => f.id === formState.selectedFieldId
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--ds-gray-400)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--ds-gray-200)] bg-white px-4 py-2 dark:border-[var(--ds-gray-700)] dark:bg-[var(--ds-gray-900)]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/admin/form-builder")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
              {eventName || "Form Builder"}
            </h1>
            <p className="text-xs text-[var(--ds-gray-500)]">
              {formState.fields.length} field{formState.fields.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="h-8 w-8"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="h-8 w-8"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-8 gap-1.5"
          >
            {showPreview ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {showPreview ? "Edit" : "Preview"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="h-8 gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Draft
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-8 gap-1.5 bg-[var(--ds-gray-900)] text-white hover:bg-[var(--ds-gray-800)] dark:bg-[var(--ds-gray-100)] dark:text-[var(--ds-gray-900)] dark:hover:bg-[var(--ds-gray-200)]"
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showPreview ? (
          <div className="flex-1 overflow-y-auto bg-[var(--ds-gray-50)] dark:bg-[var(--ds-gray-950)]">
            <FormPreview fields={formState.fields} />
          </div>
        ) : (
          <>
            <div className="w-64 flex-shrink-0 overflow-y-auto">
              <FieldPalette onAddField={handleAddField} />
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--ds-gray-50)] dark:bg-[var(--ds-gray-950)]">
              <FormCanvas
                fields={formState.fields}
                selectedFieldId={formState.selectedFieldId}
                onSelect={handleSelectField}
                onReorder={handleReorder}
                onDelete={(id) => {
                  const field = formState.fields.find((f) => f.id === id);
                  if (field) setDeleteDialogField(field);
                }}
                onDuplicate={handleDuplicateField}
              />
            </div>

            <div className="w-80 flex-shrink-0 overflow-y-auto">
              <FieldProperties
                field={selectedField || null}
                onUpdate={handleUpdateField}
              />
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {autoSaveStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-lg ${
                autoSaveStatus === "saving"
                  ? "bg-[var(--ds-gray-100)] text-[var(--ds-gray-600)] dark:bg-[var(--ds-gray-800)] dark:text-[var(--ds-gray-400)]"
                  : autoSaveStatus === "saved"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {autoSaveStatus === "saving" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {autoSaveStatus === "saved" && (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {autoSaveStatus === "error" && (
                <AlertCircle className="h-4 w-4" />
              )}
              {autoSaveStatus === "saving" && "Saving..."}
              {autoSaveStatus === "saved" && "Saved"}
              {autoSaveStatus === "error" && "Save failed"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

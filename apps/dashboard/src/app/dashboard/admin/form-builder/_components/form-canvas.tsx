"use client";

import { useState, useCallback } from "react";
import {
  GripVertical,
  Pencil,
  Copy,
  Trash2,
  Type,
  AlignLeft,
  Mail,
  Hash,
  Phone,
  MessageSquare,
  Gamepad2,
  User,
  ChevronDown,
  CheckSquare,
  Check,
  Circle,
  Calendar,
  Clock,
  Globe,
  Upload,
  Link,
  Heading,
  Minus,
  FileText,
  Plus,
} from "lucide-react";

import { Badge } from "@gameverse/ui/badge";
import { Button } from "@gameverse/ui/button";
import {
  Card,
  CardContent,
} from "@gameverse/ui/card";
import {
  FORM_FIELD_TYPE_LABELS,
  FORM_FIELD_TYPE_ICONS,
} from "@gameverse/types";
import type { FormFieldConfig } from "@gameverse/types";

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
  Clock: <Clock className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
  Link: <Link className="h-4 w-4" />,
  Heading: <Heading className="h-4 w-4" />,
  Minus: <Minus className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
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

interface FormCanvasProps {
  fields: FormFieldConfig[];
  selectedFieldId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fields: FormFieldConfig[]) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onSelect,
  onReorder,
  onDelete,
  onDuplicate,
}: FormCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTargetIndex(index);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      setDropTargetIndex(null);

      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }

      const reordered = [...fields];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(dropIndex, 0, moved!);

      const updatedFields = reordered.map((field, idx) => ({
        ...field,
        displayOrder: idx + 1,
      }));

      onReorder(updatedFields);
      setDraggedIndex(null);
    },
    [draggedIndex, fields, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  }, [deleteConfirmId, onDelete]);

  if (fields.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ds-gray-100)] dark:bg-[var(--ds-gray-800)]">
            <Plus className="h-8 w-8 text-[var(--ds-gray-400)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
            No fields yet
          </h3>
          <p className="mt-1 text-sm text-[var(--ds-gray-500)]">
            Click a field type in the left panel to add it to your form
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {fields.map((field, index) => {
        const iconName = FORM_FIELD_TYPE_ICONS[field.fieldType];
        const icon = ICON_MAP[iconName] || <Type className="h-4 w-4" />;
        const isSelected = field.id === selectedFieldId;
        const isDragging = draggedIndex === index;
        const isDropTarget = dropTargetIndex === index && draggedIndex !== index && draggedIndex !== null;

        return (
          <div
            key={field.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(field.id)}
            className={`
              group relative flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer
              ${isSelected
                ? "border-[var(--ds-blue-500)] bg-[var(--ds-blue-50)] dark:border-[var(--ds-blue-400)] dark:bg-[var(--ds-blue-950)]"
                : "border-[var(--ds-gray-200)] bg-white hover:border-[var(--ds-gray-300)] hover:bg-[var(--ds-gray-50)] dark:border-[var(--ds-gray-700)] dark:bg-[var(--ds-gray-900)] dark:hover:border-[var(--ds-gray-600)] dark:hover:bg-[var(--ds-gray-800)]"
              }
              ${isDragging ? "opacity-50" : ""}
              ${isDropTarget ? "border-t-2 border-t-[var(--ds-blue-500)]" : ""}
            `}
          >
            <div className="flex-shrink-0 cursor-grab text-[var(--ds-gray-400)] active:cursor-grabbing">
              <GripVertical className="h-4 w-4" />
            </div>

            <span className="flex-shrink-0 text-[var(--ds-gray-500)]">
              {icon}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
                  {field.label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${FIELD_TYPE_COLORS[field.fieldType] || "bg-gray-100 text-gray-800"}`}>
                  {FORM_FIELD_TYPE_LABELS[field.fieldType]}
                </span>
                {field.isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[var(--ds-gray-500)]">
                {field.fieldName}
              </p>
            </div>

            <div className="flex-shrink-0 text-xs text-[var(--ds-gray-400)]">
              #{field.displayOrder}
            </div>

            <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(field.id);
                  }}
                  className="rounded p-1 text-[var(--ds-gray-400)] hover:bg-[var(--ds-gray-100)] hover:text-[var(--ds-gray-600)] dark:hover:bg-[var(--ds-gray-700)] dark:hover:text-[var(--ds-gray-300)]"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(field.id);
                  }}
                  className={`rounded p-1 ${
                    deleteConfirmId === field.id
                      ? "bg-red-100 text-red-600"
                      : "text-[var(--ds-gray-400)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

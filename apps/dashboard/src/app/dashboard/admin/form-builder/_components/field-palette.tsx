"use client";

import {
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
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@gameverse/ui/card";
import {
  INPUT_FIELD_TYPES,
  CHOICE_FIELD_TYPES,
  LAYOUT_FIELD_TYPES,
  FORM_FIELD_TYPE_LABELS,
  FORM_FIELD_TYPE_ICONS,
} from "@gameverse/types";
import type { FormFieldType } from "@gameverse/types";

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

interface FieldPaletteProps {
  onAddField: (type: FormFieldType) => void;
}

const FIELD_GROUPS = [
  { label: "Input Fields", types: INPUT_FIELD_TYPES },
  { label: "Choice Fields", types: CHOICE_FIELD_TYPES },
  { label: "Layout Fields", types: LAYOUT_FIELD_TYPES },
] as const;

function FieldCard({ type, onAdd }: { type: FormFieldType; onAdd: () => void }) {
  const iconName = FORM_FIELD_TYPE_ICONS[type];
  const icon = ICON_MAP[iconName] || <Type className="h-4 w-4" />;

  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-2 rounded-md border border-[var(--ds-gray-200)] bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--ds-gray-50)] dark:border-[var(--ds-gray-700)] dark:bg-[var(--ds-gray-900)] dark:hover:bg-[var(--ds-gray-800)]"
    >
      <span className="text-[var(--ds-gray-500)]">{icon}</span>
      <span className="font-medium text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
        {FORM_FIELD_TYPE_LABELS[type]}
      </span>
    </button>
  );
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="flex h-full flex-col border-r border-[var(--ds-gray-200)] bg-white dark:border-[var(--ds-gray-700)] dark:bg-[var(--ds-gray-900)]">
      <div className="border-b border-[var(--ds-gray-200)] px-4 py-3 dark:border-[var(--ds-gray-700)]">
        <h3 className="text-sm font-semibold text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
          Field Types
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {FIELD_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-[var(--ds-gray-500)]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.types.map((type) => (
                <FieldCard
                  key={type}
                  type={type}
                  onAdd={() => onAddField(type)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

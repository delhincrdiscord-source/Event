"use client";

import {
  Globe,
  Gamepad2,
  MessageSquare,
} from "lucide-react";

import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import { Textarea } from "@gameverse/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gameverse/ui/select";
import { Checkbox } from "@gameverse/ui/checkbox";
import type { FormFieldConfig } from "@gameverse/types";

interface FormPreviewProps {
  fields: FormFieldConfig[];
}

export function FormPreview({ fields }: FormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-[var(--ds-gray-200)] p-8 dark:border-[var(--ds-gray-700)]">
        <div className="text-center">
          <p className="text-sm text-[var(--ds-gray-500)]">
            Add fields to see a preview of your form
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
          Form Preview
        </h2>
        <p className="text-sm text-[var(--ds-gray-500)]">
          This is how your form will appear to users
        </p>
      </div>

      {fields
        .filter((f) => f.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((field) => (
          <PreviewField key={field.id} field={field} />
        ))}

      <div className="pt-4">
        <button
          type="button"
          className="rounded-lg bg-[var(--ds-gray-900)] px-4 py-2 text-sm font-medium text-white dark:bg-[var(--ds-gray-100)] dark:text-[var(--ds-gray-900)]"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: FormFieldConfig }) {
  const renderField = () => {
    switch (field.fieldType) {
      case "SHORT_TEXT":
        return (
          <Input
            placeholder={field.placeholder || undefined}
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "LONG_TEXT":
        return (
          <Textarea
            placeholder={field.placeholder || undefined}
            defaultValue={field.defaultValue || undefined}
            className="min-h-[80px]"
          />
        );

      case "EMAIL":
        return (
          <Input
            type="email"
            placeholder={field.placeholder || "email@example.com"}
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "NUMBER":
        return (
          <Input
            type="number"
            placeholder={field.placeholder || undefined}
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "PHONE":
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || "+91 98765 43210"}
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "DISCORD_USERNAME":
        return (
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-gray-400)]" />
            <Input
              placeholder={field.placeholder || "username#0000"}
              defaultValue={field.defaultValue || undefined}
              className="h-10 pl-9"
            />
          </div>
        );

      case "DISCORD_USER_ID":
        return (
          <Input
            placeholder={field.placeholder || "123456789012345678"}
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "GAME_UID":
        return (
          <div className="relative">
            <Gamepad2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-gray-400)]" />
            <Input
              placeholder={field.placeholder || "Enter your game UID"}
              defaultValue={field.defaultValue || undefined}
              className="h-10 pl-9"
            />
          </div>
        );

      case "IGN":
        return (
          <Input
            placeholder={field.placeholder || "Enter your in-game name"}
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "SELECT":
        return (
          <Select defaultValue={field.defaultValue || undefined}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "MULTI_SELECT":
        return (
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox />
                {option.label}
              </label>
            ))}
          </div>
        );

      case "CHECKBOX":
        return (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox />
            {field.label}
          </label>
        );

      case "RADIO":
        return (
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name={field.fieldName}
                  value={option.value}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case "DATE":
        return (
          <Input
            type="date"
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "TIME":
        return (
          <Input
            type="time"
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );

      case "COUNTRY":
        return (
          <Select defaultValue={field.defaultValue || undefined}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={field.placeholder || "Select a country"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "FILE_UPLOAD":
        return (
          <div className="flex items-center gap-2">
            <input type="file" className="text-sm text-[var(--ds-gray-500)]" />
          </div>
        );

      case "URL":
        return (
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-gray-400)]" />
            <Input
              type="url"
              placeholder={field.placeholder || "https://"}
              defaultValue={field.defaultValue || undefined}
              className="h-10 pl-9"
            />
          </div>
        );

      case "SECTION_HEADER":
        return null;

      case "DIVIDER":
        return null;

      case "PARAGRAPH":
        return null;

      default:
        return (
          <Input
            placeholder={field.placeholder || undefined}
            defaultValue={field.defaultValue || undefined}
            className="h-10"
          />
        );
    }
  };

  if (field.fieldType === "SECTION_HEADER") {
    return (
      <div className="pt-4 pb-2">
        <h2 className="text-lg font-semibold text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
          {field.label}
        </h2>
        {field.description && (
          <p className="mt-1 text-sm text-[var(--ds-gray-500)]">
            {field.description}
          </p>
        )}
      </div>
    );
  }

  if (field.fieldType === "DIVIDER") {
    return <hr className="border-[var(--ds-gray-200)] dark:border-[var(--ds-gray-700)]" />;
  }

  if (field.fieldType === "PARAGRAPH") {
    return (
      <p className="text-sm text-[var(--ds-gray-600)] dark:text-[var(--ds-gray-400)]">
        {field.description || field.label}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {field.fieldType !== "CHECKBOX" && (
        <Label htmlFor={field.fieldName} className="text-sm font-medium">
          {field.label}
          {field.isRequired && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </Label>
      )}
      {field.description && (
        <p className="text-xs text-[var(--ds-gray-500)]">
          {field.description}
        </p>
      )}
      {renderField()}
      {field.helpText && (
        <p className="text-xs text-[var(--ds-gray-400)]">{field.helpText}</p>
      )}
    </div>
  );
}

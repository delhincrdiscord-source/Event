"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
} from "lucide-react";

import { Button } from "@gameverse/ui/button";
import { Input } from "@gameverse/ui/input";
import { Label } from "@gameverse/ui/label";
import { Textarea } from "@gameverse/ui/textarea";
import { Switch } from "@gameverse/ui/switch";
import { Separator } from "@gameverse/ui/separator";
import type { FormFieldConfig, FormFieldOption } from "@gameverse/types";
import type { UpdateFormFieldInput } from "@gameverse/types";

interface FieldPropertiesProps {
  field: FormFieldConfig | null;
  onUpdate: (data: UpdateFormFieldInput) => void;
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: FormFieldOption[];
  onChange: (options: FormFieldOption[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");

  const addOption = useCallback(() => {
    if (!newLabel.trim()) return;
    const value = newLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    onChange([...options, { label: newLabel.trim(), value }]);
    setNewLabel("");
  }, [newLabel, options, onChange]);

  const removeOption = useCallback(
    (index: number) => {
      onChange(options.filter((_, i) => i !== index));
    },
    [options, onChange]
  );

  const updateOption = useCallback(
    (index: number, updates: Partial<FormFieldOption>) => {
      onChange(
        options.map((opt, i) => (i === index ? { ...opt, ...updates } : opt))
      );
    },
    [options, onChange]
  );

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 flex-shrink-0 text-[var(--ds-gray-400)]" />
          <Input
            value={option.label}
            onChange={(e) => updateOption(index, { label: e.target.value })}
            placeholder="Label"
            className="h-8 text-sm"
          />
          <Input
            value={option.value}
            onChange={(e) => updateOption(index, { value: e.target.value })}
            placeholder="Value"
            className="h-8 text-sm"
          />
          <button
            type="button"
            onClick={() => removeOption(index)}
            className="flex-shrink-0 rounded p-1 text-[var(--ds-gray-400)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New option label"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          className="h-8 flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-gray-500)]">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function FieldProperties({ field, onUpdate }: FieldPropertiesProps) {
  if (!field) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ds-gray-100)] dark:bg-[var(--ds-gray-800)]">
            <Settings className="h-6 w-6 text-[var(--ds-gray-400)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
            Select a field to edit
          </h3>
          <p className="mt-1 text-xs text-[var(--ds-gray-500)]">
            Click on a field in the canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const hasOptions = ["SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"].includes(
    field.fieldType
  );
  const hasTextValidation = [
    "SHORT_TEXT",
    "LONG_TEXT",
    "EMAIL",
    "PHONE",
    "DISCORD_USERNAME",
    "DISCORD_USER_ID",
    "GAME_UID",
    "IGN",
    "URL",
  ].includes(field.fieldType);

  return (
    <div className="flex h-full flex-col border-l border-[var(--ds-gray-200)] bg-white dark:border-[var(--ds-gray-700)] dark:bg-[var(--ds-gray-900)]">
      <div className="border-b border-[var(--ds-gray-200)] px-4 py-3 dark:border-[var(--ds-gray-700)]">
        <h3 className="text-sm font-semibold text-[var(--ds-gray-900)] dark:text-[var(--ds-gray-100)]">
          Field Properties
        </h3>
        <p className="text-xs text-[var(--ds-gray-500)]">
          {field.fieldType.replace(/_/g, " ")}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <Section title="Basic">
          <div className="space-y-2">
            <Label htmlFor="field-label" className="text-xs">
              Label
            </Label>
            <Input
              id="field-label"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-name" className="text-xs">
              Field Name
            </Label>
            <Input
              id="field-name"
              value={field.fieldName}
              onChange={(e) => onUpdate({ fieldName: e.target.value })}
              className="h-9 text-sm font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-description" className="text-xs">
              Description
            </Label>
            <Textarea
              id="field-description"
              value={field.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="min-h-[60px] text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-placeholder" className="text-xs">
              Placeholder
            </Label>
            <Input
              id="field-placeholder"
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </Section>

        <Separator />

        <Section title="Validation">
          <div className="flex items-center justify-between">
            <Label htmlFor="field-required" className="text-xs">
              Required
            </Label>
            <Switch
              id="field-required"
              checked={field.isRequired}
              onCheckedChange={(checked) => onUpdate({ isRequired: checked })}
            />
          </div>

          {hasTextValidation && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="field-min" className="text-xs">
                    Min Length
                  </Label>
                  <Input
                    id="field-min"
                    type="number"
                    min={0}
                    value={field.minLength ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        minLength: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="field-max" className="text-xs">
                    Max Length
                  </Label>
                  <Input
                    id="field-max"
                    type="number"
                    min={0}
                    value={field.maxLength ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="field-pattern" className="text-xs">
                  Pattern (Regex)
                </Label>
                <Input
                  id="field-pattern"
                  value={field.pattern || ""}
                  onChange={(e) => onUpdate({ pattern: e.target.value })}
                  placeholder="^[a-zA-Z]+$"
                  className="h-9 text-sm font-mono"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="field-default" className="text-xs">
              Default Value
            </Label>
            <Input
              id="field-default"
              value={field.defaultValue || ""}
              onChange={(e) => onUpdate({ defaultValue: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="field-validation-msg" className="text-xs">
              Validation Message
            </Label>
            <Input
              id="field-validation-msg"
              value={field.validationMessage || ""}
              onChange={(e) => onUpdate({ validationMessage: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </Section>

        <Separator />

        <Section title="Help">
          <div className="space-y-1">
            <Label htmlFor="field-help" className="text-xs">
              Help Text
            </Label>
            <Input
              id="field-help"
              value={field.helpText || ""}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </Section>

        {hasOptions && (
          <>
            <Separator />
            <Section title="Options">
              <OptionsEditor
                options={field.options || []}
                onChange={(options) => onUpdate({ options })}
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

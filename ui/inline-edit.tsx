"use client";

import { Ban, Check, Loader2, Pencil, Undo2, X } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";

/**
 * Compact input that fits a table cell; Enter saves, Escape cancels. With
 * `missing`, a small button next to it marks the cell as "does not exist"
 * (the input turns into a dashed placeholder) and brings it back.
 */
export function CellInput({
  value,
  onChange,
  onSave,
  onCancel,
  error,
  disabled,
  type = "text",
  label,
  autoFocus,
  missing,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  error?: string;
  disabled?: boolean;
  type?: "text" | "number";
  label: string;
  autoFocus?: boolean;
  missing?: {
    active: boolean;
    onToggle: () => void;
    /** Shown in place of the input, e.g. "Yo'q". */
    text: string;
    markLabel: string;
    restoreLabel: string;
  };
}) {
  const input = missing?.active ? (
    <span
      className={cn(
        "flex h-8 w-[72px] items-center justify-center rounded-md border border-dashed border-border-strong bg-muted text-xs text-muted-foreground",
        error && "border-destructive",
      )}
      title={error}
    >
      {missing.text}
    </span>
  ) : (
    <Input
      type={type}
      step={type === "number" ? "0.1" : undefined}
      inputMode={type === "number" ? "decimal" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave();
        if (e.key === "Escape") onCancel();
      }}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={label}
      aria-invalid={!!error}
      title={error}
      className={cn(
        "mx-auto mb-0 sm:mb-0 h-8 sm:h-8 w-[72px] px-1 sm:px-1 text-center",
        error && "border-destructive"
      )}
    />
  );

  if (!missing) return input;

  const toggleLabel = missing.active ? missing.restoreLabel : missing.markLabel;
  return (
    <div className="mx-auto flex w-fit items-center gap-0.5">
      {input}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={missing.onToggle}
        disabled={disabled}
        aria-label={`${label}: ${toggleLabel}`}
        title={toggleLabel}
        className="size-6"
      >
        {missing.active ? <Undo2 /> : <Ban />}
      </Button>
    </div>
  );
}

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-sm border transition hover:opacity-80 disabled:opacity-50";

/** Edit button, or save/cancel while the row group is being edited. */
export function EditActions({
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  labels,
}: {
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  labels: { edit: string; save: string; cancel: string };
}) {
  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className={cn(iconButton, "border-success bg-success-subtle text-success")}
        aria-label={labels.edit}
        title={labels.edit}
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={cn(iconButton, "border-success bg-success text-success-foreground")}
        aria-label={labels.save}
        title={labels.save}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className={cn(iconButton, "border-border-strong bg-background text-foreground-secondary")}
        aria-label={labels.cancel}
        title={labels.cancel}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export const firstMessage = (value: unknown) =>
  Array.isArray(value)
    ? value.join(" ")
    : typeof value === "string"
      ? value
      : undefined;

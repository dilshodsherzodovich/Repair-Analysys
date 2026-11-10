"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/ui/label";

/**
 * One labelled form control (see "Forms" in the design-system spec): label
 * (+ red * when required) above the control, then a hint or an error line.
 * Controls carry no margin; FieldGrid spaces the fields.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  span,
  className,
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  /** Help text under the control. */
  hint?: React.ReactNode;
  /** Validation message; replaces the hint. */
  error?: React.ReactNode;
  /** "full": take the whole row of a multi-column FieldGrid. */
  span?: "full";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", span === "full" && "col-span-full", className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

const COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

/** The grid every form lays its Fields in: one column on phones, 16px gaps. */
export function FieldGrid({
  columns = 1,
  className,
  children,
}: {
  columns?: keyof typeof COLUMNS;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("grid gap-4", COLUMNS[columns], className)}>{children}</div>;
}

/** A titled group of fields in a long form, separated by a line. */
export function FormSection({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right of the title, e.g. an "Add row" button. */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

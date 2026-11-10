"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { FILTER_CARD } from "@/ui/page-header";

/**
 * The one filter row used on every page (inside PageHeader's `filters` slot).
 * Standard: every control sits in a labelled FilterField, every control is
 * 36px tall, filters apply immediately, and FilterReset ("Tozalash") is the
 * only action. See "Page standards" in the design-system spec.
 */
export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {children}
    </div>
  );
}

const WIDTHS = {
  sm: "w-[140px]",
  md: "w-[200px]",
  lg: "w-[280px]",
  auto: "w-auto",
} as const;

/** A labelled filter control. The label is required: no unlabelled filters. */
export function FilterField({
  label,
  width = "md",
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode;
  width?: keyof typeof WIDTHS;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 flex-col gap-1", WIDTHS[width], className)}>
      <Label
        htmlFor={htmlFor}
        className="mb-0 text-2xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-0 sm:text-2xs"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Resets the page's filters. Rendered only while some filter is active. */
export function FilterReset({
  active,
  onReset,
}: {
  active: boolean;
  onReset: () => void;
}) {
  const t = useTranslations("Common");
  if (!active) return null;
  return (
    <Button variant="outline" size="sm" className="h-9" onClick={onReset}>
      <RotateCcw />
      {t("reset")}
    </Button>
  );
}

/** Text search for FilterBar: 36px, search icon, debounced by the caller. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const t = useTranslations("Common");
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
      <Input
        id={id}
        variant="compact"
        className="h-9 pl-8"
        value={value}
        placeholder={placeholder ?? t("search_placeholder")}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Filters for a section inside a page (a tab, an embedded table) whose page
 * header lives elsewhere. Same card as PageHeader's filters, with the
 * section's own actions (Add, exports, bulk) on the right.
 */
export function FilterPanel({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        FILTER_CARD,
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

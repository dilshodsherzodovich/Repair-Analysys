"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: { bar: "border-t-border-strong", value: "text-foreground", icon: "bg-muted text-foreground-secondary" },
  primary: { bar: "border-t-primary", value: "text-primary", icon: "bg-primary-subtle text-primary" },
  success: { bar: "border-t-success", value: "text-success", icon: "bg-success-subtle text-success" },
  warning: { bar: "border-t-warning", value: "text-warning", icon: "bg-warning-subtle text-warning" },
  danger: { bar: "border-t-destructive", value: "text-destructive", icon: "bg-destructive-subtle text-destructive" },
  violet: { bar: "border-t-category-violet", value: "text-category-violet", icon: "bg-category-violet/10 text-category-violet" },
} as const;

export type StatTone = keyof typeof TONES;

/**
 * The one tile for a summary number, used everywhere a page shows a count or
 * total: small label (+ optional icon), the number, an optional caption.
 * `tone` colours the top accent bar and the number. With `onClick` it is a
 * filter: `selected` marks the active one, `muted` dims tiles with nothing in
 * them.
 */
export function StatCard({
  label,
  hint,
  value,
  caption,
  icon: Icon,
  tone = "neutral",
  selected = false,
  muted = false,
  onClick,
  className,
}: {
  /** Short name of the number, e.g. "Bajarilgan". */
  label: React.ReactNode;
  /** Small text after the label, e.g. "(49–55)". */
  hint?: React.ReactNode;
  /** The number. */
  value: React.ReactNode;
  /** Line under the number, e.g. "2 ta lokomotiv" or a share. */
  caption?: React.ReactNode;
  icon?: React.ElementType;
  tone?: StatTone;
  selected?: boolean;
  muted?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = !!onClick;
  const Comp = interactive ? "button" : "div";
  const t = TONES[tone];

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-pressed={interactive ? selected : undefined}
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-t-4 bg-background px-4 py-3 text-left shadow-sm transition-all",
        t.bar,
        selected ? "border-primary bg-primary-subtle ring-2 ring-primary/30" : "border-border",
        interactive &&
          "cursor-pointer hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        muted && !selected && "opacity-60",
        className,
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
          {hint && <span className="ml-1 font-normal normal-case tracking-normal">{hint}</span>}
        </span>
        {Icon && (
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", t.icon)}>
            <Icon className="size-4" />
          </span>
        )}
      </span>
      <span className={cn("text-2xl font-bold leading-tight tabular-nums", tone === "neutral" ? "text-foreground" : t.value)}>
        {value}
      </span>
      {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
    </Comp>
  );
}

/** Grid for a row of StatCards: 2 columns on phones, up to `columns` on wide screens. */
export function StatGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 3 | 4 | 5 | 6 | 7 | 8 | 9;
  className?: string;
}) {
  const wide = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
    7: "lg:grid-cols-7",
    8: "lg:grid-cols-8",
    9: "lg:grid-cols-9",
  }[columns];
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", wide, className)}>{children}</div>;
}

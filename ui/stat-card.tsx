"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A number with a label, for summary rows above tables. Pass `onClick` to
 * make it a filter button; `selected` then fills it with the primary colour.
 */
export function StatCard({
  label,
  hint,
  value,
  caption,
  selected = false,
  muted = false,
  onClick,
  className,
}: {
  /** Short name, e.g. "50". */
  label: React.ReactNode;
  /** Small text after the label, e.g. "(49–55)". */
  hint?: React.ReactNode;
  /** The big number. */
  value: React.ReactNode;
  /** Line under the number, e.g. "2 locomotives". */
  caption?: React.ReactNode;
  selected?: boolean;
  /** Dims the card, e.g. when its count is zero. */
  muted?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = !!onClick;
  const Comp = interactive ? "button" : "div";

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-pressed={interactive ? selected : undefined}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-all",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border-strong bg-background",
        interactive &&
          !selected &&
          "cursor-pointer hover:border-primary/40 hover:bg-surface-muted",
        interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        muted && !selected && "opacity-60",
        className,
      )}
    >
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-sm font-semibold",
            selected ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
        {hint && (
          <span
            className={cn(
              "text-xs",
              selected ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {hint}
          </span>
        )}
      </span>
      <span
        className={cn(
          "text-2xl font-bold leading-tight",
          selected ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
      {caption && (
        <span
          className={cn(
            "text-xs",
            selected ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {caption}
        </span>
      )}
    </Comp>
  );
}

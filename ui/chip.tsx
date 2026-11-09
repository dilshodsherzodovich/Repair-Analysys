"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small rounded pill. Clickable chips (`onClick`) toggle a filter and show
 * `selected`; removable chips (`onRemove`) show an × for an applied filter.
 * Tint a chip with a category colour through `className`
 * (e.g. "bg-category-teal/10 text-category-teal border-category-teal/25").
 */
export function Chip({
  selected = false,
  onClick,
  onRemove,
  removeLabel = "Remove",
  className,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const base = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-foreground-secondary",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          base,
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          !selected && "hover:border-border-strong hover:bg-surface-muted",
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={base}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

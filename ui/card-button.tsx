"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A card you can click: selectable summary tiles, filter cards, KPI tiles
 * with custom content. `selected` draws the primary ring; pass
 * `selectedClassName` to ring it in a category colour instead
 * (e.g. "ring-category-teal/40 border-category-teal/60").
 */
export function CardButton({
  selected = false,
  selectedClassName,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean;
  selectedClassName?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-xl border bg-card p-4 text-left shadow-sm transition-all cursor-pointer",
        "hover:border-border-strong hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:opacity-50",
        selected
          ? cn("ring-2 ring-offset-1 ring-offset-background", selectedClassName ?? "border-primary ring-primary/40")
          : "border-border",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Full-width row that opens and closes a section below it (accordion groups,
 * collapsible report blocks). Shows a chevron unless `chevron={false}`; put the
 * row's content as children.
 */
export function DisclosureTrigger({
  open,
  chevron = true,
  chevronSide = "start",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  open: boolean;
  /** Chevron that turns with `open`. */
  chevron?: boolean;
  /** `start`: before the content, points right when closed. `end`: after it, flips when open. */
  chevronSide?: "start" | "end";
}) {
  const icon = chevron && (
    <ChevronDown
      className={cn(
        "size-4 shrink-0 text-muted-foreground transition-transform",
        chevronSide === "start" ? !open && "-rotate-90" : open && "rotate-180",
      )}
    />
  );
  return (
    <button
      type="button"
      aria-expanded={open}
      className={cn(
        "flex w-full items-center gap-3 text-left transition-colors cursor-pointer hover:bg-surface-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    >
      {chevronSide === "start" && icon}
      {children}
      {chevronSide === "end" && icon}
    </button>
  );
}

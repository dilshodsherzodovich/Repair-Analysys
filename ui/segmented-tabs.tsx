"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export interface SegmentedTabsOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * A compact switch between a few views (e.g. List / By group). The active
 * option is filled with the primary colour.
 */
export function SegmentedTabs({
  value,
  onValueChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedTabsOption[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border border-border-strong bg-background p-1",
          className,
        )}
      >
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-foreground-secondary data-[state=inactive]:hover:bg-muted",
              "[&_svg]:size-4 [&_svg]:shrink-0",
            )}
          >
            {option.icon}
            {option.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

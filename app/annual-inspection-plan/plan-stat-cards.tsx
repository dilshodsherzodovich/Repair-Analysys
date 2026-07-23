"use client";

import { cn } from "@/lib/utils";
import { QUARTER_LABELS, accentFor } from "./plan-grid-shared";

export interface StatItem {
  id: number;
  name: string;
  yearly: number;
  quarters: Record<number, number>;
}

/**
 * One card per inspection type — total + per-quarter breakdown. Clicking a card
 * selects that type (click again to clear); the selected id drives the filter
 * on the detail tables below.
 */
export function PlanStatCards({
  items,
  selectedId,
  onSelect,
}: {
  items: StatItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
      {items.map((item, i) => {
        const accent = accentFor(i);
        const selected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? null : item.id)}
            className={cn(
              "text-left rounded-xl border bg-card shadow-sm px-3.5 py-3 transition-all",
              selected
                ? cn("ring-2 ring-offset-1 ring-offset-background border-transparent", accent.ringColor, accent.soft)
                : "border-border hover:border-foreground/20 hover:shadow"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("h-4 w-1.5 rounded-full shrink-0", accent.bar)} />
                <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
              </div>
              <span className={cn("text-2xl font-bold tabular-nums leading-none shrink-0", accent.text)}>
                {item.yearly}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1">
              {QUARTER_LABELS.map((q, qi) => (
                <div
                  key={q}
                  className="rounded-md bg-muted/50 dark:bg-muted/30 px-1 py-1 text-center"
                >
                  <div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    {q} kv
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground leading-tight">
                    {item.quarters[qi + 1] || 0}
                  </div>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

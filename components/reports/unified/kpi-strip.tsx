"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UnifiedKpis } from "./use-unified-report-data";

/** Which detail section a tile drills into. `null` = show every section. */
export type UnifiedSection = "inspections" | "duration" | "entry";

/** Unresolved values render as a skeleton — never as a misleading `0`. */
function Value({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value == null) {
    return <div className="h-8 w-16 rounded bg-gray-200 animate-pulse" />;
  }
  return (
    <p className="text-3xl font-bold tabular-nums leading-none">
      {value.toLocaleString()}
      {suffix}
    </p>
  );
}

const TONES = {
  neutral: {
    idle: "border-t-gray-300",
    active: "ring-gray-400 border-t-gray-500",
  },
  danger: { idle: "border-t-red-400", active: "ring-red-400 border-t-red-500" },
  warning: {
    idle: "border-t-amber-400",
    active: "ring-amber-400 border-t-amber-500",
  },
} as const;

function Tile({
  label,
  tone,
  active,
  dimmed,
  onClick,
  children,
}: {
  label: string;
  tone: keyof typeof TONES;
  active: boolean;
  /** Another tile owns the selection, so this one steps back visually. */
  dimmed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "text-left bg-white rounded-xl border border-gray-200 border-t-4 px-4 py-3 shadow-sm transition-all",
        "hover:border-gray-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        TONES[tone].idle,
        active && cn("ring-2", TONES[tone].active),
        dimmed && "opacity-55 hover:opacity-100",
      )}
    >
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      {children}
    </button>
  );
}

export function KpiStrip({
  kpis,
  activeSection,
  onSelectSection,
}: {
  kpis: UnifiedKpis;
  activeSection: UnifiedSection | null;
  /** Receives the tile's section, or `null` when the selection is cleared. */
  onSelectSection: (section: UnifiedSection | null) => void;
}) {
  const t = useTranslations("UnifiedInspectionReport");

  // Clicking the active tile clears the drill-down rather than re-selecting it.
  const state = (section: UnifiedSection) => ({
    active: activeSection === section,
    dimmed: activeSection !== null && activeSection !== section,
    onClick: () => onSelectSection(activeSection === section ? null : section),
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile label={t("kpiTotal")} tone="neutral" {...state("inspections")}>
        <Value value={kpis.total} />
      </Tile>

      <Tile label={t("kpiDelayedEntry")} tone="danger" {...state("entry")}>
        <Value value={kpis.delayedEntry} />
        {kpis.delayedEntryLocomotives != null && (
          <p className="text-[11px] text-gray-400 mt-1.5">
            {kpis.delayedEntryLocomotives} {t("delayedLocomotivesCount")}
          </p>
        )}
      </Tile>

      <Tile label={t("kpiDelayedDuration")} tone="warning" {...state("duration")}>
        <Value value={kpis.delayedDuration} />
      </Tile>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  ExcludedTypeCount,
  UnifiedKpis,
} from "./use-unified-report-data";
import { CardButton } from "@/ui/card-button";

/** Which detail section a tile drills into. `null` = show every section. */
export type UnifiedSection = "inspections" | "duration" | "entry";

/** Unresolved values render as a skeleton — never as a misleading `0`. */
function Value({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value == null) {
    return <div className="h-8 w-16 rounded bg-border animate-pulse" />;
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
    idle: "border-t-border-strong",
    active: "ring-foreground-subtle border-t-muted-foreground",
  },
  danger: { idle: "border-t-destructive", active: "ring-destructive border-t-destructive" },
  warning: {
    idle: "border-t-warning",
    active: "ring-warning border-t-warning",
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
    <CardButton selected={active} selectedClassName={cn("ring-2", TONES[tone].active)} className={cn("border-t-4 px-4 py-3", TONES[tone].idle, dimmed && "opacity-55 hover:opacity-100")}
      onClick={onClick}
    >
      <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
      {children}
    </CardButton>
  );
}

export function KpiStrip({
  kpis,
  excludedTypes = [],
  activeSection,
  onSelectSection,
}: {
  kpis: UnifiedKpis;
  /** Types left out of `kpis.total`, listed under it with their counts. */
  excludedTypes?: ExcludedTypeCount[];
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
        {kpis.total != null && excludedTypes.length > 0 && (
          <p className="text-2xs text-foreground-subtle mt-1.5">
            {t("excludedNote")}:{" "}
            {excludedTypes
              .map((type) => `${type.name} · ${type.total.toLocaleString()}`)
              .join(", ")}
          </p>
        )}
      </Tile>

      <Tile label={t("kpiDelayedEntry")} tone="danger" {...state("entry")}>
        <Value value={kpis.delayedEntry} />
        {kpis.delayedEntryLocomotives != null && (
          <p className="text-2xs text-foreground-subtle mt-1.5">
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

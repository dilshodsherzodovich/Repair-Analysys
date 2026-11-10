"use client";

import { useTranslations } from "next-intl";
import type { ExcludedTypeCount, UnifiedKpis } from "./use-unified-report-data";
import { Skeleton } from "@/ui/skeleton";
import { StatCard, StatGrid } from "@/ui/stat-card";

/** Which detail section a tile drills into. `null` = show every section. */
export type UnifiedSection = "inspections" | "duration" | "entry";

/** Unresolved values render as a skeleton, never as a misleading `0`. */
function value(n: number | null) {
  return n == null ? <Skeleton className="h-7 w-16" /> : n.toLocaleString();
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
    selected: activeSection === section,
    muted: activeSection !== null && activeSection !== section,
    onClick: () => onSelectSection(activeSection === section ? null : section),
  });

  return (
    <StatGrid columns={3}>
      <StatCard
        label={t("kpiTotal")}
        value={value(kpis.total)}
        caption={
          kpis.total != null && excludedTypes.length > 0
            ? `${t("excludedNote")}: ${excludedTypes
                .map((type) => `${type.name} · ${type.total.toLocaleString()}`)
                .join(", ")}`
            : undefined
        }
        {...state("inspections")}
      />
      <StatCard
        label={t("kpiDelayedEntry")}
        tone="danger"
        value={value(kpis.delayedEntry)}
        caption={
          kpis.delayedEntryLocomotives != null
            ? `${kpis.delayedEntryLocomotives} ${t("delayedLocomotivesCount")}`
            : undefined
        }
        {...state("entry")}
      />
      <StatCard
        label={t("kpiDelayedDuration")}
        tone="warning"
        value={value(kpis.delayedDuration)}
        {...state("duration")}
      />
    </StatGrid>
  );
}

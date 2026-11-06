"use client";

import { useCallback, useMemo } from "react";
import { useInspectionsReport } from "@/api/hooks/use-report-inspections";
import { useDelayedInspectionsReport } from "@/api/hooks/use-delayed-inspections-report";
import { useDelayedRepairDurationReport } from "@/api/hooks/use-delayed-repair-duration-report";
import type { Inspection } from "@/api/types/report-inspection";
import type {
  DelayedInspectionsLocomotive,
  DelayedInspectionsReportResponse,
  DelayedInspectionsSummary,
} from "@/api/types/delayed-inspections-report";
import type { DelayedRepairDurationRow } from "@/api/types/delayed-repair-duration-report";

/**
 * Inspection types kept out of this report entirely — totals, breakdown and all
 * three tables alike.
 *
 * The exclusion is applied consistently rather than to the row list only: a type
 * missing from the denominator but present in a delay table would break the
 * report's premise that both delay sets are subsets of the total.
 */
export const EXCLUDED_INSPECTION_TYPE_IDS = [10, 12];

export interface UnifiedFilters {
  organization: number;
  fromDate: string;
  toDate: string;
  branch?: number;
  /** Applied client-side — see the note on `useUnifiedReportData`. */
  inspectionType?: number;
}

export interface TypeBreakdownRow {
  id: number;
  name: string;
  total: number;
  /** Inspections of this type that were entered late. */
  delayedEntry: number;
  /** Inspections of this type that ran past their repair norm. */
  delayedDuration: number;
}

/** An excluded type's size, shown so the user can see what the total leaves out. */
export interface ExcludedTypeCount {
  id: number;
  name: string;
  total: number;
}

export interface UnifiedKpis {
  total: number | null;
  /** Inspections entered late — a subset of `total`, like `delayedDuration`. */
  delayedEntry: number | null;
  /** How many distinct locomotives those late entries span. */
  delayedEntryLocomotives: number | null;
  delayedDuration: number | null;
}

/**
 * Narrows a delayed-entry response and recomputes its summary.
 *
 * The server's `summary` counts every type it returned, so it cannot be reused
 * once rows are dropped — every figure here is recounted from what survives.
 */
function narrowEntryReport(
  report: DelayedInspectionsReportResponse | undefined,
  keep: (typeId: number) => boolean,
): {
  locomotives: DelayedInspectionsLocomotive[];
  summary?: DelayedInspectionsSummary;
} {
  if (!report) return { locomotives: [] };

  const locomotives = report.data
    .map((loco) => {
      const inspections = loco.inspections.filter((i) =>
        keep(i.inspection_type_id),
      );
      return {
        ...loco,
        inspections,
        delayed_inspections_count: inspections.length,
      };
    })
    .filter((loco) => loco.inspections.length > 0);

  const all = locomotives.flatMap((l) => l.inspections);

  return {
    locomotives,
    summary: {
      delayed_locomotives_count: locomotives.length,
      delayed_inspections_count: all.length,
      // "both" rows are counted in the hour and mileage tallies alike, matching
      // how the endpoint reports them.
      hour_delayed_count: all.filter((i) => i.hours.is_delayed).length,
      mileage_delayed_count: all.filter((i) => i.mileage.is_delayed).length,
      both_delayed_count: all.filter((i) => i.delay_type === "both").length,
    },
  };
}

/**
 * Composes the three inspection reports into one derived view.
 *
 * All three share a grain — the inspection event — over the same window:
 * inspections performed is the denominator, and both delay reports are strict
 * subsets of it (entered late, and ran past the repair norm). A locomotive can
 * appear in both, so the two subsets overlap and must never be added together.
 *
 * **Inspection type is filtered in the browser, not on the server.** Every query
 * here already pulls its whole result set for the window (`no_page` on the
 * inspection list; the two delay reports are unpaginated), so the data for every
 * type is in memory after the first load. Sending `inspection_type` would refetch
 * all of it to show a subset we already have — picking a type is instant instead,
 * and does not change any query key.
 */
export function useUnifiedReportData(f: UnifiedFilters) {
  const keepType = useCallback(
    (typeId: number) =>
      !EXCLUDED_INSPECTION_TYPE_IDS.includes(typeId) &&
      (f.inspectionType == null || typeId === f.inspectionType),
    [f.inspectionType],
  );

  // Row data for section 1, and — through `counts` — the KPI total and the
  // per-type breakdown, so all three describe the same set of inspections.
  // A full month of one organization is a large payload — give it room over
  // the 60s default.
  const { data: inspectionsData, isFetching: inspectionsLoading } =
    useInspectionsReport({
      organization: f.organization,
      branch: f.branch,
      fromDate: f.fromDate,
      toDate: f.toDate,
      // The report counts work actually completed: cancelled inspections and
      // still-open ones are not part of it.
      is_cancelled: false,
      is_closed: true,
      no_page: true,
      timeout: 5 * 60 * 1000,
    });

  const { data: delayedEntryRaw, isFetching: delayedEntryLoading } =
    useDelayedInspectionsReport({
      organization: f.organization,
      branch: f.branch,
      fromDate: f.fromDate,
      toDate: f.toDate,
    });

  const { data: durationData, isFetching: durationLoading } =
    useDelayedRepairDurationReport({
      organization: f.organization,
      branch: f.branch,
      fromDate: f.fromDate,
      toDate: f.toDate,
    });

  // ── Derivation ─────────────────────────────────────────────────────────────

  const delayedEntry = useMemo(
    () => narrowEntryReport(delayedEntryRaw, keepType),
    [delayedEntryRaw, keepType],
  );

  const inspectionRows = useMemo(
    () =>
      (inspectionsData?.results ?? []).filter((row) =>
        keepType(row.inspection_type?.id ?? -1),
      ) as Inspection[],
    [inspectionsData, keepType],
  );

  const durationRows = useMemo(
    () =>
      (durationData?.data ?? []).filter((row) =>
        keepType(row.inspection_type_id),
      ) as DelayedRepairDurationRow[],
    [durationData, keepType],
  );

  const kpis = useMemo<UnifiedKpis>(
    () => ({
      total: inspectionsData
        ? inspectionsData.counts
            .filter((c) => keepType(c.inspection_type.id))
            .reduce((sum, c) => sum + c.count, 0)
        : null,
      delayedEntry: delayedEntry.summary?.delayed_inspections_count ?? null,
      delayedEntryLocomotives:
        delayedEntry.summary?.delayed_locomotives_count ?? null,
      delayedDuration: durationData ? durationRows.length : null,
    }),
    [inspectionsData, keepType, delayedEntry, durationData, durationRows],
  );

  /**
   * The breakdown always covers every type, ignoring the picked one — it is the
   * type picker, so narrowing it to the selection would leave nothing to click.
   * Its delay tallies are therefore counted from the unnarrowed responses.
   */
  const breakdown = useMemo<TypeBreakdownRow[]>(() => {
    if (!inspectionsData) return [];
    const allowed = (id: number) => !EXCLUDED_INSPECTION_TYPE_IDS.includes(id);

    const durationByType = new Map<number, number>();
    for (const row of durationData?.data ?? []) {
      const id = row.inspection_type_id;
      durationByType.set(id, (durationByType.get(id) ?? 0) + 1);
    }

    const entryByType = new Map<number, number>();
    for (const loco of delayedEntryRaw?.data ?? []) {
      for (const insp of loco.inspections) {
        const id = insp.inspection_type_id;
        entryByType.set(id, (entryByType.get(id) ?? 0) + 1);
      }
    }

    return inspectionsData.counts
      .filter((c) => c.count > 0 && allowed(c.inspection_type.id))
      .map(({ inspection_type, count }) => ({
        id: inspection_type.id,
        name: inspection_type.name,
        total: count,
        delayedEntry: entryByType.get(inspection_type.id) ?? 0,
        delayedDuration: durationByType.get(inspection_type.id) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [inspectionsData, durationData, delayedEntryRaw]);

  // Kept apart from `breakdown` so the exports, which mirror the totals, never
  // pick these up as if they counted.
  const excludedTypes = useMemo<ExcludedTypeCount[]>(
    () =>
      (inspectionsData?.counts ?? [])
        .filter(
          (c) =>
            c.count > 0 &&
            EXCLUDED_INSPECTION_TYPE_IDS.includes(c.inspection_type.id),
        )
        .map(({ inspection_type, count }) => ({
          id: inspection_type.id,
          name: inspection_type.name,
          total: count,
        })),
    [inspectionsData],
  );

  return {
    kpis,
    breakdown,
    excludedTypes,
    inspections: {
      rows: inspectionRows,
      isLoading: inspectionsLoading,
    },
    delayedEntry: {
      locomotives: delayedEntry.locomotives,
      summary: delayedEntry.summary,
      isLoading: delayedEntryLoading,
    },
    delayedDuration: {
      rows: durationRows,
      isLoading: durationLoading,
    },
  };
}

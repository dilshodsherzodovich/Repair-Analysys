import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { delayedInspectionsReportService } from "../services/delayed-inspections-report.service";
import type { DelayedInspectionsReportParams } from "../types/delayed-inspections-report";

/**
 * Locomotives taken into inspection late over a date range.
 *
 * `fromDate` / `toDate` are required by the endpoint — it 400s without them —
 * so the query stays disabled until both are known.
 */
export const useDelayedInspectionsReport = (
  params: Partial<DelayedInspectionsReportParams>,
) =>
  useQuery({
    queryKey: [queryKeys.delayedInspectionsReport.get, params],
    queryFn: () =>
      delayedInspectionsReportService.get(
        params as DelayedInspectionsReportParams,
      ),
    enabled: !!params.fromDate && !!params.toDate,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

// Types are re-exported here so the report pages import them alongside the hook.
export type * from "../types/delayed-inspections-report";

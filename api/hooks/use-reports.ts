import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { reportsService } from "../services/reports.service";
import { ReportDateRangeParams } from "../types/reports";

/**
 * Every reports-dashboard query shares the same window and caching policy, so
 * they are built from one factory rather than repeated five times.
 */
const reportQueryOptions = (params: ReportDateRangeParams) => ({
  enabled: !!params.fromDate && !!params.toDate,
  retry: false,
  refetchOnWindowFocus: false,
  staleTime: 5 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
});

export const useCategorizedLocomotives = (params: ReportDateRangeParams) =>
  useQuery({
    queryKey: [queryKeys.reports.categorized, params],
    queryFn: () => reportsService.getCategorizedLocomotives(params),
    ...reportQueryOptions(params),
  });

/** Name used by the ported report components. */
export const useReports = useCategorizedLocomotives;

export const useInspectionTypeLocomotives = (params: ReportDateRangeParams) =>
  useQuery({
    queryKey: [queryKeys.reports.inspectionTypes, params],
    queryFn: () => reportsService.getInspectionTypeLocomotives(params),
    ...reportQueryOptions(params),
  });

export const useTxk2InspectionTypeLocomotives = (
  params: ReportDateRangeParams,
) =>
  useQuery({
    queryKey: [queryKeys.reports.txk2InspectionTypes, params],
    queryFn: () => reportsService.getTxk2InspectionTypeLocomotives(params),
    ...reportQueryOptions(params),
  });

/**
 * Locomotives overdue to *enter* an inspection.
 *
 * A current-state snapshot rather than a period aggregate: it answers "which
 * locomotives are overdue right now?", so there is no date window to scope it
 * by. Unlike the other reports queries it is therefore enabled as soon as an
 * organization is known, not once a date range is picked.
 */
export const useDelayedLocomotives = (
  params: Omit<ReportDateRangeParams, "fromDate" | "toDate">,
) =>
  useQuery({
    queryKey: [queryKeys.reports.delayed, params],
    queryFn: () => reportsService.getDelayedLocomotives(params),
    enabled: !!params.organization,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

export const useReservedLocomotives = (params: ReportDateRangeParams) =>
  useQuery({
    queryKey: [queryKeys.reports.reserved, params],
    queryFn: () => reportsService.getReservedLocomotives(params),
    ...reportQueryOptions(params),
  });

// Types are re-exported here so the report pages import them alongside the hook.
export type * from "../types/reports";

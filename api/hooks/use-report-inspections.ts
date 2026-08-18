import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { reportInspectionsService } from "../services/report-inspections.service";

interface InspectionsArgs {
  page?: number;
  organization?: number;
  branch?: number;
  is_closed?: boolean;
  is_cancelled?: boolean;
  locomotive_type?: string;
  inspection_type?: string;
  no_page?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
  locomotive?: number | string;
  last_inspections_count?: number;
  /** Skip the "an organization must be chosen" guard (admin views). */
  orgNotRequired?: boolean;
  is_all_signed?: boolean;
  is_reported?: boolean;
  factory_id?: number;
  timing?: string;
  enabled?: boolean;
  /** Axios timeout in ms. Bump for heavy `no_page` pulls. */
  timeout?: number;
}

const buildParams = ({
  enabled,
  timeout,
  orgNotRequired,
  ...rest
}: InspectionsArgs) =>
  Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== ""),
  ) as Record<string, string | number | boolean | undefined>;

export const useInspections = (args: InspectionsArgs) => {
  const { enabled = true, orgNotRequired, organization, timeout } = args;
  return useQuery({
    queryKey: [queryKeys.reportInspections.list, args],
    queryFn: () => reportInspectionsService.getInspections(buildParams(args), timeout),
    enabled: enabled && (orgNotRequired || !!organization),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInspectionsReport = (args: InspectionsArgs) => {
  const { enabled = true, orgNotRequired, organization, timeout } = args;
  return useQuery({
    queryKey: [queryKeys.reportInspections.report, args],
    queryFn: () =>
      reportInspectionsService.getInspectionsReport(buildParams(args), timeout),
    enabled: enabled && (orgNotRequired || !!organization),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInspectionCountStats = ({
  organization,
  branch,
  fromDate,
  toDate,
}: {
  organization?: number | string;
  branch?: number | string;
  fromDate?: string;
  toDate?: string;
}) =>
  useQuery({
    queryKey: [
      queryKeys.reportInspections.countStats,
      { organization, branch, fromDate, toDate },
    ],
    queryFn: () => {
      // "all" means "no filter" — drop the param rather than sending it.
      const params: Record<string, string | number | undefined> = {};
      if (organization && organization !== "all") params.organization = +organization;
      if (branch && branch !== "all") params.branch = +branch;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      return reportInspectionsService.getInspectionCountStats(params);
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

// Types are re-exported here so the report pages import them alongside the hook.
export type { InspectionResponse } from "../types/report-inspection";
export type { InspectionCountStatsResponse } from "../services/report-inspections.service";

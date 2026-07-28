import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { delayedRepairDurationReportService } from "../services/delayed-repair-duration-report.service";

export const useDelayedRepairDurationReport = ({
  fromDate,
  toDate,
  organization,
  branch,
  inspectionType,
  isClosed,
}: {
  fromDate?: string;
  toDate?: string;
  organization?: number;
  branch?: number;
  inspectionType?: number;
  /** undefined → all, true → closed only, false → open only */
  isClosed?: boolean;
}) =>
  useQuery({
    queryKey: [
      queryKeys.delayedRepairDurationReport.get,
      { fromDate, toDate, organization, branch, inspectionType, isClosed },
    ],
    queryFn: () =>
      delayedRepairDurationReportService.get({
        fromDate,
        toDate,
        organization,
        branch,
        inspection_type: inspectionType,
        is_closed: isClosed,
      }),
    enabled: !!fromDate && !!toDate,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

// Types are re-exported here so the report pages import them alongside the hook.
export type {
  DelayedRepairDurationRow,
  DelayedRepairDurationResponse,
} from "../types/delayed-repair-duration-report";

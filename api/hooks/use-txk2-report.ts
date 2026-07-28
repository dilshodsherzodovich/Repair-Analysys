import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { txk2ReportService } from "../services/txk2-report.service";

export const useTxk2Report = ({
  organizationId,
  dateFrom,
  dateTo,
}: {
  organizationId?: number | null;
  dateFrom?: string;
  dateTo?: string;
}) =>
  useQuery({
    queryKey: [queryKeys.txk2Report.get, { organizationId, dateFrom, dateTo }],
    queryFn: () =>
      txk2ReportService.get({
        organization_id: organizationId,
        date_from: dateFrom,
        date_to: dateTo,
      }),
    enabled: organizationId != null && !!dateFrom && !!dateTo,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// Types are re-exported here so the report pages import them alongside the hook.
export type {
  Txk2ReportRow,
  Txk2ReportResponse,
  NextInspectionType,
} from "../types/txk2-report";

import { useQuery } from "@tanstack/react-query";
import { txk13ReportService } from "../services/txk13-report.service";
import type { Txk13ReportParams } from "../types/txk13-report";

export function useTxk13Report(params: Txk13ReportParams | null) {
  return useQuery({
    queryKey: ["txk13-report", params],
    queryFn: () => txk13ReportService.getReport(params!),
    enabled: params != null && !!params.organization,
    staleTime: 2 * 60 * 1000,
  });
}

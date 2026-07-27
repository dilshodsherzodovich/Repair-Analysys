import { useQuery } from "@tanstack/react-query";
import { txk13ReportService } from "../services/txk13-report.service";
import type {
  Txk13Locomotive,
  Txk13ReportParams,
} from "../types/txk13-report";

export function useTxk13Report(params: Txk13ReportParams | null) {
  return useQuery({
    queryKey: ["txk13-report", params],
    queryFn: () => txk13ReportService.getReport(params!),
    enabled: params != null && !!params.organization,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Convenience selector: fetch the org-wide txk13 report and return the single
 * locomotive matching `locomotiveId`. This is where the passport reads its
 * headline mileage/bandaj/manufacture stats and its per-inspection norms.
 */
export function useLocomotiveTxk13(
  organizationId?: number,
  locomotiveId?: number,
  enabled: boolean = true
) {
  const query = useTxk13Report(
    enabled && organizationId ? { organization: organizationId } : null
  );

  let locomotive: Txk13Locomotive | undefined;
  if (query.data?.data) {
    for (const org of query.data.data) {
      const match = org.locomotives?.find((l) => l.id === locomotiveId);
      if (match) {
        locomotive = match;
        break;
      }
    }
  }

  return { ...query, locomotive };
}

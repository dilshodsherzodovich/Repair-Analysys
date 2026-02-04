import { useQuery } from "@tanstack/react-query";
import { locomotiveMileageReportService } from "../services/locomotive-mileage-report.service";
import type { LocomotiveMileageReportParams } from "../types/locomotive-mileage-report";
import { queryKeys } from "../querykey";

export function useLocomotiveMileageReport(
  params: LocomotiveMileageReportParams | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [queryKeys.locomotiveMileageReport.get, params],
    queryFn: () => locomotiveMileageReportService.getReport(params!),
    enabled: (options?.enabled !== false && params != null && !!params.organization) ?? false,
    staleTime: 2 * 60 * 1000,
  });
}

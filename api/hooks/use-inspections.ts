import { useQuery } from "@tanstack/react-query";
import { inspectionsService } from "../services/inspections.service";
import { InspectionsGetParams } from "../types/inspections";
import { queryKeys } from "../querykey";

export function useInspections(
  params?: InspectionsGetParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [queryKeys.inspections.list, params],
    queryFn: () => inspectionsService.getInspections(params),
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled !== false,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}

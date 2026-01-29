import { useQuery } from "@tanstack/react-query";
import { inspectionService } from "../services/inspection.service";
import { queryKeys } from "../querykey";

export function useInspectionTypes(enabled: boolean = true) {
  return useQuery({
    queryKey: [queryKeys.inspectionTypes.list],
    queryFn: () => inspectionService.getInspectionTypes(),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}


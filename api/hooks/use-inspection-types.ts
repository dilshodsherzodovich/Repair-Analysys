import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { inspectionTypesServices } from "../services/inspection-type.service";

export const useGetInspectionTypes = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [queryKeys.inspectionTypes.list],
    queryFn: () => inspectionTypesServices.getInspectionTypes(),
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

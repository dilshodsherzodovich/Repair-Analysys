import { locomotivesService } from "../services/locomotives.service";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";

export const useGetLocomotives = () => {
  return useQuery({
    queryKey: [queryKeys.locomotives.list],
    queryFn: () => locomotivesService.getLocomotives(),
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { locomotiveModelsService } from "../services/locomotive-models.service";

export const useLocomotiveModels = (enabled: boolean = true) =>
  useQuery({
    queryKey: [queryKeys.locomotiveModels.list],
    queryFn: () => locomotiveModelsService.getAll(),
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { locomotiveModelsService } from "../services/locomotive-models.service";
import { LocomotiveModelParams } from "../types/locomotive-model";

export const useLocomotiveModels = (
  enabled: boolean = true,
  params?: LocomotiveModelParams,
) =>
  useQuery({
    queryKey: [queryKeys.locomotiveModels.list, params ?? null],
    queryFn: () => locomotiveModelsService.getAll(params),
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

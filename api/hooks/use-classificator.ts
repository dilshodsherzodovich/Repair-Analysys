import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classificatorService } from "../services/classificator.service";
import { queryKeys } from "../querykey";
import {
  ClassificatorCreateParams,
  ClassificatorGetParams,
  ClassificatorUpdateParams,
} from "../types/classificator";

export const useGetClassificators = (
  params: ClassificatorGetParams = { page: 1 }
) => {
  return useQuery({
    queryKey: [queryKeys.classificators.list, { ...params }],
    queryFn: () => classificatorService.getAllClassificators(params),
  });
};

export const useCreateClassificator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.classificators.create],
    mutationFn: (data: ClassificatorCreateParams) =>
      classificatorService.createClassificator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.classificators.list],
      });
    },
  });
};

export const useEditClassificator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.classificators.edit],
    mutationFn: (params: ClassificatorUpdateParams) =>
      classificatorService.editClassificator(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.classificators.list],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.classificators.detail(params.id)],
      });
    },
  });
};

export const useDeleteClassificator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [queryKeys.classificators.delete],
    mutationFn: (id: string) => classificatorService.deleteClassificator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.classificators.list],
        exact: false,
      });
    },
  });
};

export const useBulkDeleteClassificators = () => {
  return useMutation({
    mutationKey: [queryKeys.classificators.delete],
    mutationFn: (ids: string[]) =>
      classificatorService.bulkDeleteClassificators(ids),
  });
};

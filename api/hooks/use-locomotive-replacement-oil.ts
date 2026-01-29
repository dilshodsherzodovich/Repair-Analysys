import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locomotiveReplacementOilService } from "../services/locomotive-replacement-oil.service";
import {
  LocomotiveReplacementOilParams,
  CreateLocomotiveReplacementOilPayload,
  UpdateLocomotiveReplacementOilPayload,
} from "../types/locomotive-replacement-oil";
import { queryKeys } from "../querykey";

export function useLocomotiveReplacementOils(
  params?: LocomotiveReplacementOilParams
) {
  return useQuery({
    queryKey: [queryKeys.locomotiveReplacementOils.all, params],
    queryFn: () => locomotiveReplacementOilService.getReplacementOils(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateLocomotiveReplacementOil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocomotiveReplacementOilPayload) =>
      locomotiveReplacementOilService.createReplacementOil(payload),
    mutationKey: [queryKeys.locomotiveReplacementOils.create],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotiveReplacementOils.all],
      });
    },
  });
}

export function useUpdateLocomotiveReplacementOil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateLocomotiveReplacementOilPayload;
    }) => locomotiveReplacementOilService.updateReplacementOil(id, payload),
    mutationKey: [queryKeys.locomotiveReplacementOils.update],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotiveReplacementOils.all],
      });
    },
  });
}

export function useDeleteLocomotiveReplacementOil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      locomotiveReplacementOilService.deleteReplacementOil(id),
    mutationKey: [queryKeys.locomotiveReplacementOils.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotiveReplacementOils.all],
      });
    },
  });
}


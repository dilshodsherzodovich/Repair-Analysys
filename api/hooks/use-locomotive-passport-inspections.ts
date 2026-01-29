import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locomotivePassportInspectionsService } from "../services/locomotive-passport-inspections.service";
import {
  LocomotivePassportInspectionParams,
  CreateLocomotivePassportInspectionPayload,
  UpdateLocomotivePassportInspectionPayload,
} from "../types/locomotive-passport-inspections";
import { queryKeys } from "../querykey";

export function useLocomotivePassportInspections(
  params?: LocomotivePassportInspectionParams
) {
  return useQuery({
    queryKey: [queryKeys.locomotivePassportInspections.all, params],
    queryFn: () => locomotivePassportInspectionsService.getInspections(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateLocomotivePassportInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocomotivePassportInspectionPayload) =>
      locomotivePassportInspectionsService.createInspection(payload),
    mutationKey: [queryKeys.locomotivePassportInspections.create],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotivePassportInspections.all],
      });
    },
  });
}

export function useUpdateLocomotivePassportInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateLocomotivePassportInspectionPayload;
    }) => locomotivePassportInspectionsService.updateInspection(id, payload),
    mutationKey: [queryKeys.locomotivePassportInspections.update],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotivePassportInspections.all],
      });
    },
  });
}

export function useDeleteLocomotivePassportInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      locomotivePassportInspectionsService.deleteInspection(id),
    mutationKey: [queryKeys.locomotivePassportInspections.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.locomotivePassportInspections.all],
      });
    },
  });
}


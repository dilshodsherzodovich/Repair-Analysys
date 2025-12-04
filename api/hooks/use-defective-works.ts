"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defectiveWorksService } from "../services/defective-works.service";
import {
  DefectiveWorkListParams,
  DefectiveWorkCreatePayload,
  DefectiveWorkUpdatePayload,
} from "../types/defective-works";
import { queryKeys } from "../querykey";

export function useDefectiveWorks(params?: DefectiveWorkListParams) {
  return useQuery({
    queryKey: [queryKeys.defectiveWorks.all, params],
    queryFn: () => defectiveWorksService.getDefectiveWorks(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateDefectiveWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DefectiveWorkCreatePayload) =>
      defectiveWorksService.createDefectiveWork(payload),
    mutationKey: [queryKeys.defectiveWorks.create],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.all],
      });
    },
  });
}

export function useUpdateDefectiveWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: DefectiveWorkUpdatePayload;
    }) => defectiveWorksService.updateDefectiveWork(id, payload),
    mutationKey: [queryKeys.defectiveWorks.update],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.all],
      });
    },
  });
}

export function useDeleteDefectiveWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      defectiveWorksService.deleteDefectiveWork(id),
    mutationKey: [queryKeys.defectiveWorks.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.all],
      });
    },
  });
}

export const useBulkCreateDefectiveWorks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DefectiveWorkCreatePayload[]) =>
      defectiveWorksService.bulkCreateDefectiveWorks(payload),
    mutationKey: [queryKeys.defectiveWorks.bulkCreate],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.all],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.bulkCreate],
      });
    },
  });
};

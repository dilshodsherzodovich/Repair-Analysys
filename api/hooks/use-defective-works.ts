"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defectiveWorksService } from "../services/defective-works.service";
import {
  DefectiveWorkListParams,
  DefectiveWorkCreatePayload,
  DefectiveWorkUpdatePayload,
  RevisionRemarkGroupParams,
  RevisionJournalGroupParams,
  EchRemarkGroupParams,
} from "../types/defective-works";
import { queryKeys } from "../querykey";

export function useRevisionRemarkGroups(
  params?: RevisionRemarkGroupParams,
  options?: { enabled?: boolean; token?: string },
) {
  return useQuery({
    queryKey: [
      queryKeys.defectiveWorks.remarkGroups,
      params,
      options?.token ? "temp-token" : "session",
    ],
    queryFn: () =>
      defectiveWorksService.getRevisionRemarkGroups(params, options?.token),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useRevisionJournalGroups(
  params?: RevisionJournalGroupParams,
  options?: { enabled?: boolean; token?: string },
) {
  return useQuery({
    queryKey: [
      queryKeys.defectiveWorks.journalGroups,
      params,
      options?.token ? "temp-token" : "session",
    ],
    queryFn: () =>
      defectiveWorksService.getRevisionJournalGroups(params, options?.token),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useEchRemarkGroups(
  params?: EchRemarkGroupParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [queryKeys.defectiveWorks.echRemarkGroups, params],
    queryFn: () => defectiveWorksService.getEchRemarkGroups(params),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useEchDefectiveWorks(
  params?: DefectiveWorkListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [queryKeys.defectiveWorks.echJournal, params],
    queryFn: () => defectiveWorksService.getEchDefectiveWorks(params),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateEchDefectiveWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DefectiveWorkCreatePayload) =>
      defectiveWorksService.createEchDefectiveWork(payload),
    mutationKey: [queryKeys.defectiveWorks.echJournal, "create"],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.echJournal],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.all],
      });
    },
  });
}

export function useDefectiveWorks(params?: DefectiveWorkListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [queryKeys.defectiveWorks.all, params],
    queryFn: () => defectiveWorksService.getDefectiveWorks(params),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
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
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.echJournal],
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
      queryClient.invalidateQueries({
        queryKey: [queryKeys.defectiveWorks.echJournal],
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

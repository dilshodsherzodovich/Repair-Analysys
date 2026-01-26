"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { delaysService } from "../services/delays.service";
import {
  DelayListParams,
  DelayCreatePayload,
  DelayUpdatePayload,
  DelayReportParams,
} from "../types/delays";
import { queryKeys } from "../querykey";

export function useDelays(params?: DelayListParams) {
  return useQuery({
    queryKey: [queryKeys.delays.all, params],
    queryFn: () => delaysService.getDelays(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useDelay(id: number | string | null) {
  return useQuery({
    queryKey: [queryKeys.delays.detail, id],
    queryFn: () => delaysService.getDelay(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DelayCreatePayload) =>
      delaysService.createDelay(payload),
    mutationKey: [queryKeys.delays.create],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.all],
      });
    },
  });
}

export function useBulkCreateDelays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DelayCreatePayload[]) =>
      delaysService.bulkCreateDelays(payload),
    mutationKey: [queryKeys.delays.bulkCreate],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.all],
      });
    },
  });
}

export function useUpdateDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: DelayUpdatePayload;
    }) => delaysService.updateDelay(id, payload),
    mutationKey: [queryKeys.delays.update],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.all],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.detail(id)],
      });
    },
  });
}

export function useDeleteDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => delaysService.deleteDelay(id),
    mutationKey: [queryKeys.delays.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.all],
      });
    },
  });
}

export function useDelayReports(params?: DelayReportParams) {
  return useQuery({
    queryKey: [queryKeys.delays.reports, params],
    queryFn: () => delaysService.getDelayReports(params!),
    enabled: !!params?.start_date && !!params?.end_date,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}


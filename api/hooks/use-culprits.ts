"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { culpritsService } from "../services/culprits.service";
import {
  CulpritListParams,
  CulpritCreatePayload,
  CulpritUpdatePayload,
} from "../types/culprits";
import { queryKeys } from "../querykey";

const noRetryOnAuth = (failureCount: number, error: any) => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return false;
  }
  return failureCount < 2;
};

export function useCulprits(params?: CulpritListParams, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.culprits.all, params],
    queryFn: () => culpritsService.getCulprits(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: noRetryOnAuth,
  });
}

export function useCulprit(id: number | string | null) {
  return useQuery({
    queryKey: [queryKeys.culprits.detail, id],
    queryFn: () => culpritsService.getCulprit(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: noRetryOnAuth,
  });
}

export function useCreateCulprit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CulpritCreatePayload) =>
      culpritsService.createCulprit(payload),
    mutationKey: [queryKeys.culprits.create],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.culprits.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.delays.all] });
    },
  });
}

export function useUpdateCulprit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: CulpritUpdatePayload;
    }) => culpritsService.updateCulprit(id, payload),
    mutationKey: [queryKeys.culprits.update],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.culprits.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.delays.all] });
    },
  });
}

export function useDeleteCulprit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => culpritsService.deleteCulprit(id),
    mutationKey: [queryKeys.culprits.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.culprits.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.delays.all] });
    },
  });
}

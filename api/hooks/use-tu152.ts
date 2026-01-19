"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tu152Service } from "../services/tu152.service";
import { TU152ListParams, TU152UpdatePayload } from "../types/tu152";
import { queryKeys } from "../querykey";

export function useTU152List(params?: TU152ListParams) {
  return useQuery({
    queryKey: [queryKeys.tu152.all, params],
    queryFn: () => tu152Service.getTU152List(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useTU152Locomotives() {
  return useQuery({
    queryKey: [queryKeys.tu152.locomotives],
    queryFn: () => tu152Service.getLocomotives(),
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useTU152LocomotiveModels() {
  return useQuery({
    queryKey: [queryKeys.tu152.locomotiveModels],
    queryFn: () => tu152Service.getLocomotiveModels(),
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUpdateTU152Entry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: TU152UpdatePayload;
    }) => tu152Service.updateTU152Entry(id, payload),
    mutationKey: [queryKeys.tu152.update],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.tu152.all],
      });
    },
  });
}


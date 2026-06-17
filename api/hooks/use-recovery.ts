"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recoveryService } from "../services/recovery.service";
import {
  RecoveryListParams,
  PayrollConfirmPayload,
  RecoverPayload,
} from "../types/recovery";
import { queryKeys } from "../querykey";

const noRetryOnAuth = (failureCount: number, error: any) => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return false;
  }
  return failureCount < 2;
};

export function useRecoveryDelays(params?: RecoveryListParams) {
  return useQuery({
    queryKey: [queryKeys.recovery.all, params],
    queryFn: () => recoveryService.getRecoveryDelays(params),
    staleTime: 2 * 60 * 1000,
    retry: noRetryOnAuth,
  });
}

export function useRecoveryDelay(id: number | string | null) {
  return useQuery({
    queryKey: [queryKeys.recovery.detail, id],
    queryFn: () => recoveryService.getRecoveryDelay(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    retry: noRetryOnAuth,
  });
}

export function usePayrollConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: PayrollConfirmPayload;
    }) => recoveryService.payrollConfirm(id, payload),
    mutationKey: [queryKeys.recovery.payrollConfirm],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.recovery.all] });
    },
  });
}

export function useRecover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: RecoverPayload;
    }) => recoveryService.recover(id, payload),
    mutationKey: [queryKeys.recovery.recover],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.recovery.all] });
    },
  });
}

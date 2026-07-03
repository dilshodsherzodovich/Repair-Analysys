"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { delaysService } from "../services/delays.service";
import {
  DelayListParams,
  DelayCreatePayload,
  DelayUpdatePayload,
  UploadProtocolPayload,
  ClassifyPayload,
  DelayReportParams,
  SrivPaymentReportParams,
  SrivPaymentReportDetailsParams,
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

export function useAcceptDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => delaysService.acceptDelay(id),
    mutationKey: [queryKeys.delays.accept],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.delays.all] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.detail(id)],
      });
    },
  });
}

export function useUploadProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UploadProtocolPayload;
    }) => delaysService.uploadProtocol(id, payload),
    mutationKey: [queryKeys.delays.uploadProtocol],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.delays.all] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.detail(id)],
      });
    },
  });
}

export function useClassifyDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: ClassifyPayload;
    }) => delaysService.classifyDelay(id, payload),
    mutationKey: [queryKeys.delays.classify],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.delays.all] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.delays.detail(id)],
      });
    },
  });
}

export function useDelayReportsByPassengerTrain(params?: DelayReportParams) {
  return useQuery({
    queryKey: [queryKeys.delays.reports, params],
    queryFn: () => delaysService.getDelayReportsByPassengerTrain(params!),
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

export function useDelayReportsByFreightTrain(params?: DelayReportParams) {
  return useQuery({
    queryKey: [queryKeys.delays.reports, "freight", params],
    queryFn: () => delaysService.getDelayReportsByFreightTrain(params!),
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

export function useDepotReasonReports(params?: DelayReportParams) {
  return useQuery({
    queryKey: [queryKeys.delays.depotReasonReports, params],
    queryFn: () => delaysService.getDepotReasonReports(params!),
    enabled: !!params?.start_date && !!params?.end_date && !!params?.train_types,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useSrivPaymentReport(params?: SrivPaymentReportParams) {
  return useQuery({
    queryKey: [queryKeys.delays.paymentReport, params],
    queryFn: () => delaysService.getSrivPaymentReport(params!),
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

export function useSrivPaymentReportDetails(
  params?: SrivPaymentReportDetailsParams
) {
  return useQuery({
    queryKey: [queryKeys.delays.paymentReportDetails, params],
    queryFn: () => delaysService.getSrivPaymentReportDetails(params!),
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


import { locomotivesService } from "../services/locomotives.service";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import {
  LocomotiveModelGetParams,
  LokomotiveDataGetParams,
} from "../types/locomotive";

export const useGetLocomotives = (
  enabled: boolean = true,
  temporaryToken?: string,
  params?: LokomotiveDataGetParams
) => {
  return useQuery({
    queryKey: [queryKeys.locomotives.list, temporaryToken, params],
    queryFn: () => locomotivesService.getLocomotives(temporaryToken, params),
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useGetLocomotiveDetail = (
  id?: number | string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [queryKeys.locomotives.detail(id ?? "unknown")],
    queryFn: () => locomotivesService.getLocomotiveDetail(id!),
    enabled: enabled && !!id,
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
};

export const useGetLocomotiveModels = (params: LocomotiveModelGetParams) => {
  return useQuery({
    queryKey: [queryKeys.locomotives.models.list, { ...params }],
    queryFn: () => locomotivesService.getLocomotiveModels(params),
    enabled: !!params?.no_page || !!params?.page,
    staleTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

import { useQuery } from "@tanstack/react-query";
import { statisticsService } from "../services/statistics.service";
import { JournalStatisticsParams } from "../types/statistics";
import { queryKeys } from "../querykey";

const retry = (failureCount: number, error: any) => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return false;
  }
  return failureCount < 2;
};

export function useMprStatistics(params?: JournalStatisticsParams) {
  return useQuery({
    queryKey: [queryKeys.statistics.mpr, params],
    queryFn: () => statisticsService.getMprStatistics(params),
    staleTime: 5 * 60 * 1000,
    retry,
  });
}

export function useRevisionStatistics(params?: JournalStatisticsParams) {
  return useQuery({
    queryKey: [queryKeys.statistics.revision, params],
    queryFn: () => statisticsService.getRevisionStatistics(params),
    staleTime: 5 * 60 * 1000,
    retry,
  });
}

export function usePantographStatistics(params?: JournalStatisticsParams) {
  return useQuery({
    queryKey: [queryKeys.statistics.pantograph, params],
    queryFn: () => statisticsService.getPantographStatistics(params),
    staleTime: 5 * 60 * 1000,
    retry,
  });
}

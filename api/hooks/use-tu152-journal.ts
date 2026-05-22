"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { tu152JournalService } from "../services/tu152-journal.service";
import {
  CombinedJournalListParams,
  CombinedJournalPayload,
} from "../types/tu152-journal";
import { queryKeys } from "../querykey";

export function useTU152JournalList(params?: CombinedJournalListParams) {
  return useQuery({
    queryKey: [queryKeys.tu152Journal.all, params],
    queryFn: () => tu152JournalService.getList(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useTU152JournalInfinite(
  params: Omit<CombinedJournalListParams, "page" | "no_page"> = {},
  pageSize: number = 20,
) {
  return useInfiniteQuery({
    queryKey: [queryKeys.tu152Journal.all, "infinite", params, pageSize],
    queryFn: ({ pageParam }) =>
      tu152JournalService.getList({
        ...params,
        page: pageParam as number,
        page_size: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined;
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateTU152Journal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CombinedJournalPayload) =>
      tu152JournalService.create(payload),
    mutationKey: [queryKeys.tu152Journal.create],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.tu152Journal.all],
      });
    },
  });
}

export function useUpdateTU152Journal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: Partial<CombinedJournalPayload>;
    }) => tu152JournalService.update(id, payload),
    mutationKey: [queryKeys.tu152Journal.update],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.tu152Journal.all],
      });
    },
  });
}

export function useDeleteTU152Journal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => tu152JournalService.remove(id),
    mutationKey: [queryKeys.tu152Journal.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.tu152Journal.all],
      });
    },
  });
}

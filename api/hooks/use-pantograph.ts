import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pantographService } from "../services/pantograph.service";
import {
  PantographJournalParams,
  CreatePantographJournalPayload,
  UpdatePantographJournalPayload,
} from "../types/pantograph";
import { queryKeys } from "../querykey";

export function usePantographJournal(params?: PantographJournalParams) {
  return useQuery({
    queryKey: [queryKeys.pantograph.all, params],
    queryFn: () => pantographService.getJournal(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreatePantographEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePantographJournalPayload) =>
      pantographService.createEntry(payload),
    mutationKey: [queryKeys.pantograph.create],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.pantograph.all] });
    },
  });
}

export function useUpdatePantographEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdatePantographJournalPayload;
    }) => pantographService.updateEntry(id, payload),
    mutationKey: [queryKeys.pantograph.update],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.pantograph.all] });
    },
  });
}

export function useDeletePantographEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => pantographService.deleteEntry(id),
    mutationKey: [queryKeys.pantograph.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.pantograph.all] });
    },
  });
}

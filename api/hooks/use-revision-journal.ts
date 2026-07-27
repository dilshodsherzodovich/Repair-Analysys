import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { revisionJournalService } from "../services/revision-journal.service";
import {
  RevisionJournalParams,
  CreateRevisionJournalPayload,
  UpdateRevisionJournalPayload,
} from "../types/revision-journal";
import { queryKeys } from "../querykey";

export function useRevisionJournal(params?: RevisionJournalParams) {
  return useQuery({
    queryKey: [queryKeys.revisionJournal.all, params],
    queryFn: () => revisionJournalService.getJournal(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateRevisionJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRevisionJournalPayload) =>
      revisionJournalService.createEntry(payload),
    mutationKey: [queryKeys.revisionJournal.create],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.revisionJournal.all],
      });
    },
  });
}

export function useUpdateRevisionJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdateRevisionJournalPayload;
    }) => revisionJournalService.updateEntry(id, payload),
    mutationKey: [queryKeys.revisionJournal.update],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.revisionJournal.all],
      });
    },
  });
}

export function useDeleteRevisionJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      revisionJournalService.deleteEntry(id),
    mutationKey: [queryKeys.revisionJournal.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.revisionJournal.all],
      });
    },
  });
}

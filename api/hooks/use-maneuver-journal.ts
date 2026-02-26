import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import {
  getManeuverJournals,
  createManeuverJournal,
  updateManeuverJournal,
} from "../services/maneuver-journal";
import {
  ManeuverJournalParams,
  ManeuverJournalCreateData,
  ManeuverJournalUpdateData,
} from "../types/maneuver-journal";

export function useManeuverJournals(params?: ManeuverJournalParams) {
  return useQuery({
    queryKey: queryKeys.maneuverJournal.list(params),
    queryFn: () => getManeuverJournals(params),
  });
}

export function useCreateManeuverJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ManeuverJournalCreateData) =>
      createManeuverJournal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["maneuver-journal-list"],
      });
    },
  });
}

export function useUpdateManeuverJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: ManeuverJournalUpdateData;
    }) => updateManeuverJournal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["maneuver-journal-list"],
      });
    },
  });
}

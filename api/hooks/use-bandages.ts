import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bandagesService } from "../services/bandages.service";
import {
  Bandage,
  BandageParams,
  BulkUpdateBandageItem,
  UpdateBandagePayload,
} from "../types/bandage";
import { queryKeys } from "../querykey";

export function useBandages(params: BandageParams, enabled = true) {
  return useQuery({
    queryKey: [queryKeys.bandages.list, params],
    queryFn: () => bandagesService.getBandages(params),
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}

export function useUpdateBandage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBandagePayload }) =>
      bandagesService.updateBandage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.bandages.list] });
    },
  });
}

export function useBulkUpdateBandages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkUpdateBandageItem[]) =>
      bandagesService.bulkUpdateBandages(items),
    onSuccess: ({ items }) => {
      // Put the saved values in the cache right away so the table never shows
      // the old ones while the refetch is in flight
      const updated = new Map(items.map((item) => [item.id, item]));
      queryClient.setQueriesData<Bandage[]>(
        { queryKey: [queryKeys.bandages.list] },
        (old) =>
          old?.map((bandage) =>
            updated.has(bandage.id)
              ? { ...bandage, ...updated.get(bandage.id) }
              : bandage,
          ),
      );
      queryClient.invalidateQueries({ queryKey: [queryKeys.bandages.list] });
    },
  });
}

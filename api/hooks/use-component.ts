import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { componentService } from "../services/component.service";
import { ComponentParams, ComponentValue } from "../types/component";
import { queryKeys } from "../querykey";

export function useComponents(
  params?: ComponentParams,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [queryKeys.components.list, params],
    queryFn: () => componentService.getComponents(params),
    enabled: enabled && (!!params?.locomotive || !!params?.section), // Only fetch when locomotive or section is selected
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useBulkUpdateComponentValues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ComponentValue[]) =>
      componentService.bulkUpdateComponentValues(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.components.list] });
    },
  });
}

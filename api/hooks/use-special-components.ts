import { useMutation, useQueryClient } from "@tanstack/react-query";

import { specialComponentsService } from "../services/special-components.service";
import { queryKeys } from "../querykey";

export function useUpdateSpecialComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Record<string, string | number | null>;
    }) => specialComponentsService.updateSpecialComponent(id, payload),
    onSuccess: () => {
      // Invalidate locomotives queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: [queryKeys.locomotives.list] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.locomotives.detail] });
    },
  });
}

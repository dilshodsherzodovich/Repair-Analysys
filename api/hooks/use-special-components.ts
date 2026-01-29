import { useMutation, useQueryClient } from "@tanstack/react-query";

import { SpecialComponent } from "../types/locomotive";
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
      payload: Partial<Omit<SpecialComponent, "id" | "year_of_manufacture" | "factory_number">>;
    }) => specialComponentsService.updateSpecialComponent(id, payload),
    onSuccess: () => {
      // Invalidate locomotives queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: [queryKeys.locomotives.list] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.locomotives.detail] });
    },
  });
}


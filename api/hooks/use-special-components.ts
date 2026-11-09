import { useMutation, useQueryClient } from "@tanstack/react-query";

import { specialComponentsService } from "../services/special-components.service";
import { queryKeys } from "../querykey";
import { PaginatedData } from "../types/general";
import { SortedLocomotiveData } from "../types/locomotive";

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
    onSuccess: (updated) => {
      // Put the saved values in the cached locomotive lists right away so a
      // table never shows the old ones while the refetch is in flight. The
      // cached section object is kept; the response may carry only its id.
      queryClient.setQueriesData<PaginatedData<SortedLocomotiveData>>(
        { queryKey: [queryKeys.locomotives.list] },
        (old) =>
          old?.results
            ? {
                ...old,
                results: old.results.map((locomotive) =>
                  locomotive.special_components?.some(
                    (component) => component.id === updated.id,
                  )
                    ? {
                        ...locomotive,
                        special_components: locomotive.special_components.map(
                          (component) =>
                            component.id === updated.id
                              ? {
                                  ...component,
                                  ...updated,
                                  section: component.section,
                                }
                              : component,
                        ),
                      }
                    : locomotive,
                ),
              }
            : old,
      );

      // Invalidate locomotives queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: [queryKeys.locomotives.list] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.locomotives.detail] });
    },
  });
}

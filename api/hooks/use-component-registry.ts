import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { componentRegistryService } from "../services/component-registry.service";
import {
  ComponentRegistryParams,
  CreateComponentRegistryPayload,
} from "../types/component-registry";
import { queryKeys } from "../querykey";

export function useComponentRegistry(params?: ComponentRegistryParams) {
  return useQuery({
    queryKey: [queryKeys.componentRegistry.all, params],
    queryFn: () => componentRegistryService.getRegistry(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateComponentRegistry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateComponentRegistryPayload) =>
      componentRegistryService.createEntry(payload),
    mutationKey: [queryKeys.componentRegistry.create],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.componentRegistry.all],
      });
    },
  });
}

export function useDeleteComponentRegistry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      componentRegistryService.deleteEntry(id),
    mutationKey: [queryKeys.componentRegistry.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.componentRegistry.all],
      });
    },
  });
}


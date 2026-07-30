import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { componentRegistryService } from "../services/component-registry.service";
import {
  ComponentGroupDetailsParams,
  ComponentRegistryParams,
  CreateComponentRegistryPayload,
} from "../types/component-registry";
import { queryKeys } from "../querykey";

export function useComponentRegistry(
  params?: ComponentRegistryParams,
  enabled = true
) {
  return useQuery({
    queryKey: [queryKeys.componentRegistry.all, params],
    queryFn: () => componentRegistryService.getRegistry(params),
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/** Paginated group list for the group picker: server-side search, page per scroll. */
export function useComponentGroupsInfinite(
  search = "",
  enabled = true,
  pageSize = 20
) {
  return useInfiniteQuery({
    queryKey: [queryKeys.componentRegistry.groups, "infinite", search, pageSize],
    queryFn: ({ pageParam }) =>
      componentRegistryService.getGroups({
        page: pageParam as number,
        page_size: pageSize,
        search,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined;
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useComponentRegistryByGroup(
  params: Partial<ComponentGroupDetailsParams>,
  enabled = true
) {
  return useQuery({
    queryKey: [queryKeys.componentRegistry.byGroupDetails, params],
    queryFn: () =>
      componentRegistryService.getByGroupDetails({
        group_id: params.group_id!,
        start_date: params.start_date,
        end_date: params.end_date,
      }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!params.group_id,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status === 400 || status === 401 || status === 403 || status === 404) {
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

export function useUpdateComponentRegistry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: CreateComponentRegistryPayload;
    }) => componentRegistryService.updateEntry(id, payload),
    mutationKey: [queryKeys.componentRegistry.update],
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


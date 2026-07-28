import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../querykey";
import { branchesService } from "../services/branches.service";

/** Branches (uchastka) list — used by the report filters. Rarely changes. */
export const useBranches = (params?: { organization?: number }) =>
  useQuery({
    queryKey: [queryKeys.branches.list, params],
    queryFn: () => branchesService.getBranches(params),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

export type { Branch } from "../services/branches.service";

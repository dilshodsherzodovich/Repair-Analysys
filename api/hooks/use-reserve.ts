import { useQuery } from "@tanstack/react-query";
import { reserveService } from "../services/reserve.service";
import { ReserveGetParams } from "../types/reserve";
import { queryKeys } from "../querykey";

export function useReserve(
  params: ReserveGetParams | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [queryKeys.reserve.list, params],
    queryFn: () => reserveService.getReserve(params!),
    enabled: options?.enabled !== false && params != null,
    staleTime: 2 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}

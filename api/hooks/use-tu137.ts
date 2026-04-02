import { useQuery } from "@tanstack/react-query";
import { tu137Service } from "../services/tu137.service";
import { Tu137Params } from "../types/tu137";
import { queryKeys } from "../querykey";

export function useTu137Records(params?: Tu137Params) {
  return useQuery({
    queryKey: [queryKeys.tu137.all, params],
    queryFn: () => tu137Service.getRecords(params),
    staleTime: 5 * 60 * 1000,
    enabled: params?.p_depo_id !== undefined && params?.p_depo_id !== null,
  });
}

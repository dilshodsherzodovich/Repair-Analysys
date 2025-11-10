"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "../services/orders.service";
import { OrdersGetParams } from "../types/orders";
import { queryKeys } from "../querykey";

export function useOrders(params?: OrdersGetParams) {
  return useQuery({
    queryKey: [queryKeys.orders.all, params],
    queryFn: () => ordersService.getOrders(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersService.deleteOrder(id),
    mutationKey: [queryKeys.orders.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.orders.all] });
    },
  });
}

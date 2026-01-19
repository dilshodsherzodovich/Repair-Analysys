"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "../services/orders.service";
import {
  OrdersGetParams,
  CreateOrderPayload,
  UpdateOrderPayload,
} from "../types/orders";
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

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderData: CreateOrderPayload) =>
      ordersService.createOrder(orderData),
    mutationKey: [queryKeys.orders.create],
    onSuccess: () => {
      // Invalidate orders list to refetch with new data
      queryClient.invalidateQueries({ queryKey: [queryKeys.orders.all] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      orderData,
    }: {
      id: number | string;
      orderData: UpdateOrderPayload;
    }) => ordersService.updateOrder(id, orderData),
    mutationKey: [queryKeys.orders.edit],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.orders.all] });
    },
  });
}
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ordersService.deleteOrder(id),
    mutationKey: [queryKeys.orders.delete],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.orders.all] });
    },
  });
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ordersService.confirmOrder(id),
    mutationKey: [queryKeys.orders.confirm],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.orders.all] });
    },
  });
}
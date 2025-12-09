import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  OrderData,
  OrdersGetParams,
  CreateOrderPayload,
  UpdateOrderPayload,
} from "../types/orders";

const buildOrderFormData = (
  orderData: CreateOrderPayload | UpdateOrderPayload
) => {
  const formData = new FormData();

  Object.entries(orderData).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

export const ordersService = {
  getOrders: async (
    params?: OrdersGetParams
  ): Promise<PaginatedData<OrderData>> => {
    try {
      const response = await api.get<PaginatedData<OrderData>>(
        "/mpr-journal/",
        {
          params: {
            page: params?.page,
            page_size: params?.page_size,
            search: params?.search,
            tab: params?.tab,
            no_page: params?.no_page,
            type_of_journal: params?.type_of_journal,
            locomotive: params?.locomotive,
            date: params?.date,
            organization: params?.organization,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },
  createOrder: async (orderData: CreateOrderPayload): Promise<OrderData> => {
    try {
      const payload = buildOrderFormData(orderData);
      const response = await api.post<OrderData>("/mpr-journal/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },
  updateOrder: async (
    id: number | string,
    orderData: UpdateOrderPayload
  ): Promise<OrderData> => {
    try {
      const payload = buildOrderFormData(orderData);
      const response = await api.put<OrderData>(
        `/mpr-journal/${id}/`,
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },
  deleteOrder: async (id: number | string): Promise<void> => {
    try {
      await api.delete(`/mpr-journal/${id}/`);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },
};

export default ordersService;

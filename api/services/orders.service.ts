import api from "../axios";
import { PaginatedData } from "../types/general";
import { OrderData, OrdersGetParams } from "../types/orders";

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
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },
  deleteOrder: async (id: string): Promise<void> => {
    try {
      await api.delete(`/mpr-journal/${id}/`);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },
};

export default ordersService;

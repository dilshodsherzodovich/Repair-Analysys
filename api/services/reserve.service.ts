import api from "../axios";
import { PaginatedData } from "../types/general";
import { ReserveItem, ReserveGetParams } from "../types/reserve";

export const reserveService = {
  async getReserve(params: ReserveGetParams): Promise<PaginatedData<ReserveItem>> {
    const response = await api.get<PaginatedData<ReserveItem>>("/reserve/", {
      params: {
        is_active: params.is_active,
        page: params.page,
        page_size: params.page_size,
      },
    });
    return response.data;
  },
};

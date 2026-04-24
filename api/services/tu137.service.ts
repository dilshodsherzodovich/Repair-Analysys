import api from "../axios";
import { Tu137Params, Tu137ApiResponse } from "../types/tu137";

export const tu137Service = {
  async getRecords(params?: Tu137Params): Promise<Tu137ApiResponse> {
    const response = await api.get<Tu137ApiResponse>("/tu137/integration/", {
      params: {
        depo_id: params?.depo_id,
        finished: params?.finished,
        mashinist_id: params?.mashinist_id,
        page: params?.page ?? 1,
        page_size: params?.page_size ?? 20,
        responsible_organization: params?.responsible_organization,
      },
    });
    return response.data;
  },
};

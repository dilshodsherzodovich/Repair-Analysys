import api from "../axios";
import { Tu137Params, Tu137ApiResponse } from "../types/tu137";

export const tu137Service = {
  async getRecords(params?: Tu137Params): Promise<Tu137ApiResponse> {
    try {
      const response = await api.get<Tu137ApiResponse>("/sriv/tu137-export/", {
        params: {
          p_depo_id: params?.p_depo_id,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching TU-137 records:", error);
      throw error;
    }
  },
};

import api from "../axios";
import {
  Bandage,
  BandageParams,
  UpdateBandagePayload,
} from "../types/bandage";

export const bandagesService = {
  /** Not paginated — always a plain array. */
  async getBandages(params?: BandageParams): Promise<Bandage[]> {
    try {
      const response = await api.get<Bandage[]>("/bandages/", {
        params: {
          locomotive: params?.locomotive,
          section: params?.section,
          component: params?.component,
          search: params?.search || undefined,
          ordering: params?.ordering || undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching bandages:", error);
      throw error;
    }
  },

  async updateBandage(
    id: number,
    payload: UpdateBandagePayload
  ): Promise<Bandage> {
    try {
      const response = await api.patch<Bandage>(`/bandages/${id}/`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating bandage:", error);
      throw error;
    }
  },
};

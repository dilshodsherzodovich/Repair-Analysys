import api from "../axios";
import {
  Bandage,
  BandageParams,
  BulkUpdateBandageItem,
  BulkUpdateBandagesResponse,
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

  /** All-or-nothing: one invalid item and nothing is saved. */
  async bulkUpdateBandages(
    items: BulkUpdateBandageItem[]
  ): Promise<BulkUpdateBandagesResponse> {
    try {
      const response = await api.patch<BulkUpdateBandagesResponse>(
        "/bandages/bulk-update/",
        items
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk updating bandages:", error);
      throw error;
    }
  },
};

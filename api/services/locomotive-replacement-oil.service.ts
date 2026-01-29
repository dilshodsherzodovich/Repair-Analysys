import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  LocomotiveReplacementOil,
  LocomotiveReplacementOilParams,
  CreateLocomotiveReplacementOilPayload,
  UpdateLocomotiveReplacementOilPayload,
} from "../types/locomotive-replacement-oil";

export const locomotiveReplacementOilService = {
  async getReplacementOils(
    params?: LocomotiveReplacementOilParams
  ): Promise<PaginatedData<LocomotiveReplacementOil>> {
    try {
      const response = await api.get<PaginatedData<LocomotiveReplacementOil>>(
        "/locomotive-replacement-oil/",
        {
          params: {
            page: params?.page,
            page_size: params?.page_size,
            search: params?.search,
            locomotive: params?.locomotive,
            section: params?.section,
            organization: params?.organization,
            no_page: params?.no_page,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching locomotive replacement oils:", error);
      throw error;
    }
  },

  async createReplacementOil(
    payload: CreateLocomotiveReplacementOilPayload
  ): Promise<LocomotiveReplacementOil> {
    try {
      const response = await api.post<LocomotiveReplacementOil>(
        "/locomotive-replacement-oil/",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating locomotive replacement oil:", error);
      throw error;
    }
  },

  async updateReplacementOil(
    id: number,
    payload: UpdateLocomotiveReplacementOilPayload
  ): Promise<LocomotiveReplacementOil> {
    try {
      const response = await api.patch<LocomotiveReplacementOil>(
        `/locomotive-replacement-oil/${id}/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating locomotive replacement oil:", error);
      throw error;
    }
  },

  async deleteReplacementOil(id: number | string): Promise<void> {
    try {
      await api.delete(`/locomotive-replacement-oil/${id}/`);
    } catch (error) {
      console.error("Error deleting locomotive replacement oil:", error);
      throw error;
    }
  },
};


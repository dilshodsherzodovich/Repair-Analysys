import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  LocomotivePassportInspection,
  LocomotivePassportInspectionParams,
  CreateLocomotivePassportInspectionPayload,
  UpdateLocomotivePassportInspectionPayload,
} from "../types/locomotive-passport-inspections";

export const locomotivePassportInspectionsService = {
  async getInspections(
    params?: LocomotivePassportInspectionParams
  ): Promise<PaginatedData<LocomotivePassportInspection>> {
    try {
      const response = await api.get<PaginatedData<LocomotivePassportInspection>>(
        "/locomotive-passport-inspections/",
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
      console.error("Error fetching locomotive passport inspections:", error);
      throw error;
    }
  },

  async createInspection(
    payload: CreateLocomotivePassportInspectionPayload
  ): Promise<LocomotivePassportInspection> {
    try {
      const response = await api.post<LocomotivePassportInspection>(
        "/locomotive-passport-inspections/",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating locomotive passport inspection:", error);
      throw error;
    }
  },

  async updateInspection(
    id: number,
    payload: UpdateLocomotivePassportInspectionPayload
  ): Promise<LocomotivePassportInspection> {
    try {
      const response = await api.patch<LocomotivePassportInspection>(
        `/locomotive-passport-inspections/${id}/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating locomotive passport inspection:", error);
      throw error;
    }
  },

  async deleteInspection(id: number | string): Promise<void> {
    try {
      await api.delete(`/locomotive-passport-inspections/${id}/`);
    } catch (error) {
      console.error("Error deleting locomotive passport inspection:", error);
      throw error;
    }
  },
};


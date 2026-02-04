import api from "../axios";
import { PaginatedData } from "../types/general";
import { Inspection, InspectionsGetParams } from "../types/inspections";

export type UpdateInspectionSectionPayload = { section: string };

export const inspectionsService = {
  /**
   * List inspections. When no_page is true the API returns an array;
   * the axios response interceptor normalizes it to PaginatedData<Inspection>.
   */
  async getInspections(
    params?: InspectionsGetParams
  ): Promise<PaginatedData<Inspection>> {
    try {
      const response = await api.get<PaginatedData<Inspection>>(
        "/inspections/",
        {
          params: {
            organization: params?.organization,
            is_closed: params?.is_closed,
            locomotive_type: params?.locomotive_type,
            inspection_type: params?.inspection_type,
            is_cancelled: params?.is_cancelled,
            no_page: params?.no_page,
            page: params?.no_page ? undefined : params?.page,
            page_size: params?.no_page ? undefined : params?.page_size,
            search: params?.search,
            start_date: params?.start_date,
            end_date: params?.end_date,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching inspections:", error);
      throw error;
    }
  },

  /**
   * Update inspection (e.g. section). PATCH /inspections/{id}/
   */
  async updateInspection(
    id: number,
    payload: UpdateInspectionSectionPayload
  ): Promise<Inspection> {
    try {
      const response = await api.patch<Inspection>(`/inspections/${id}/`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating inspection:", error);
      throw error;
    }
  },
};

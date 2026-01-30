import api from "../axios";
import { PaginatedData } from "../types/general";
import { Inspection, InspectionsGetParams } from "../types/inspections";

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
        "/uz/api/inspections/",
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
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching inspections:", error);
      throw error;
    }
  },
};

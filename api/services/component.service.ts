import api from "../axios";
import { PaginatedData } from "../types/general";
import { ComponentParams, ComponentValue } from "../types/component";

export const componentService = {
  async getComponents(
    params?: ComponentParams,
  ): Promise<PaginatedData<ComponentValue>> {
    try {
      const response = await api.get<PaginatedData<ComponentValue>>(
        "/components-values/",
        {
          params: {
            locomotive: params?.locomotive,
            section: params?.section,
            page: params?.page,
            page_size: params?.page_size,
            no_page: params?.no_page,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching components:", error);
      throw error;
    }
  },

  async bulkUpdateComponentValues(
    payload: ComponentValue[],
  ): Promise<ComponentValue[]> {
    try {
      const response = await api.patch<ComponentValue[]>(
        "/components-values/bulk_update_values/",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating component values:", error);
      throw error;
    }
  },
};

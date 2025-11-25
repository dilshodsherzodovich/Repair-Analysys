import api from "../axios";
import { InspectionType } from "../types/inspectionTypes";

export const inspectionTypesServices = {
  getInspectionTypes: async (): Promise<InspectionType[]> => {
    try {
      const response = await api.get<InspectionType[]>(
        "/inspection-types/?no_page"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching inspection types:", error);
      throw error;
    }
  },
};

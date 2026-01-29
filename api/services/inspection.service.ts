import api from "../axios";
import { InspectionType } from "../types/inspection";

export const inspectionService = {
  async getInspectionTypes(): Promise<InspectionType[]> {
    try {
      const response = await api.get<InspectionType[]>("/inspection-types/");
      return response.data;
    } catch (error) {
      console.error("Error fetching inspection types:", error);
      throw error;
    }
  },
};


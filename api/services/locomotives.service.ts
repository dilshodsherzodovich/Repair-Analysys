import api from "../axios";
import { LocomotiveData } from "../types/locomotive";

export const locomotivesService = {
  getLocomotives: async (): Promise<LocomotiveData[]> => {
    try {
      const response = await api.get<LocomotiveData[]>("/locomotives/?no_page");
      return response.data;
    } catch (error) {
      console.error("Error fetching locomotives:", error);
      throw error;
    }
  },
};

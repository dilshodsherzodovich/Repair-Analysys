import api from "../axios";
import { Classificator } from "../types/classificator";

export const classificatorDetailService = {
  getClassificatorDetail: async (id: string): Promise<Classificator> => {
    try {
      const response = await api.get<Classificator>(`/classificator/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching classificator detail:", error);
      throw error;
    }
  },
};

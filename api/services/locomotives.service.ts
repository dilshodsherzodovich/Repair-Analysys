import api from "../axios";
import { LocomotiveData } from "../types/locomotive";

export const locomotivesService = {
  getLocomotives: async (
    temporaryToken?: string
  ): Promise<LocomotiveData[]> => {
    try {
      const config = temporaryToken
        ? {
            headers: {
              Authorization: `Bearer ${temporaryToken}`,
            },
          }
        : {};
      const response = await api.get<LocomotiveData[]>(
        "/sorted/locomotives/?no_page",
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching locomotives:", error);
      throw error;
    }
  },
};

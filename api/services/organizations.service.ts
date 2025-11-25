import api from "../axios";
import { Organization } from "../types/organizations";

export const organizationsService = {
  getOrganizations: async (): Promise<Organization[]> => {
    try {
      const response = await api.get<Organization[]>("/organizations/");
      return response.data;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      throw error;
    }
  },
};

import api from "../axios";
import { Organization } from "../types/organizations";

export const organizationsService = {
  getOrganizations: async (
    params?: { no_page?: boolean; page?: number },
    temporaryToken?: string
  ): Promise<Organization[]> => {
    try {
      const config: any = {
        params: params ? { no_page: params.no_page, page: params.page } : {},
      };

      if (temporaryToken) {
        config.headers = {
          Authorization: `Bearer ${temporaryToken}`,
        };
      }

      const response = await api.get<Organization[]>("/organizations/", config);
      return response.data;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      throw error;
    }
  },
};

import api from "../axios";
import {
  MonitoringApiResponse,
  MonitoringNearDeadlineRes,
} from "../types/monitoring";

export const monitoringService = {
  getMonitoring: async (params: {
    no_page?: boolean;
  }): Promise<MonitoringApiResponse> => {
    try {
      const response = await api.get("/journal/monitoring-by-organizations/", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching monitoring:", error);
      throw error;
    }
  },

  getOrganizationNearDeadlineBulletins: async ({
    id,
  }: {
    id: string;
  }): Promise<MonitoringNearDeadlineRes> => {
    try {
      const response = await api.get(`/near-to-deadline/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching monitoring:", error);
      throw error;
    }
  },
};

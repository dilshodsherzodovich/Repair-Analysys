import api from "../axios";
import {
  JournalStatisticsParams,
  MprOrgStatistics,
  RevisionOrgStatistics,
  PantographOrgStatistics,
} from "../types/statistics";

// baseURL already ends with /api/, so paths are relative to that.
export const statisticsService = {
  async getMprStatistics(
    params?: JournalStatisticsParams
  ): Promise<MprOrgStatistics[]> {
    const response = await api.get<MprOrgStatistics[]>(
      "journal/mpr/statistics/",
      {
        params: {
          locomotive: params?.locomotive,
          locomotive_id: params?.locomotive_id,
        },
      }
    );
    return response.data;
  },

  async getRevisionStatistics(
    params?: JournalStatisticsParams
  ): Promise<RevisionOrgStatistics[]> {
    const response = await api.get<RevisionOrgStatistics[]>(
      "journal/revision/statics/",
      {
        params: {
          locomotive: params?.locomotive,
          locomotive_id: params?.locomotive_id,
          inspection_type: params?.inspection_type,
        },
      }
    );
    return response.data;
  },

  async getPantographStatistics(
    params?: JournalStatisticsParams
  ): Promise<PantographOrgStatistics[]> {
    const response = await api.get<PantographOrgStatistics[]>(
      "journal/pantograph/statics/",
      {
        params: {
          locomotive: params?.locomotive,
          locomotive_id: params?.locomotive_id,
        },
      }
    );
    return response.data;
  },
};

export default statisticsService;

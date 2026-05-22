import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  CombinedJournalEntry,
  CombinedJournalListParams,
  CombinedJournalPayload,
} from "../types/tu152-journal";

export const tu152JournalService = {
  async getList(
    params?: CombinedJournalListParams,
  ): Promise<PaginatedData<CombinedJournalEntry>> {
    try {
      const response = await api.get<PaginatedData<CombinedJournalEntry>>(
        "/combined-journal/",
        {
          params: {
            page: params?.page,
            page_size: params?.page_size,
            search: params?.search || undefined,
            locomotive_id: params?.locomotive_id || undefined,
            organization: params?.organization || undefined,
            date_from: params?.date_from || undefined,
            date_to: params?.date_to || undefined,
            no_page: params?.no_page,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching combined journal list:", error);
      throw error;
    }
  },

  async create(payload: CombinedJournalPayload): Promise<CombinedJournalEntry> {
    try {
      const response = await api.post<CombinedJournalEntry>(
        "/combined-journal/",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating combined journal entry:", error);
      throw error;
    }
  },

  async update(
    id: number | string,
    payload: Partial<CombinedJournalPayload>,
  ): Promise<CombinedJournalEntry> {
    try {
      const response = await api.patch<CombinedJournalEntry>(
        `/combined-journal/${id}/`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating combined journal entry:", error);
      throw error;
    }
  },

  async remove(id: number | string): Promise<void> {
    try {
      await api.delete(`/combined-journal/${id}/`);
    } catch (error) {
      console.error("Error deleting combined journal entry:", error);
      throw error;
    }
  },
};

export default tu152JournalService;

import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  RevisionJournalEntry,
  RevisionJournalParams,
  CreateRevisionJournalPayload,
  UpdateRevisionJournalPayload,
} from "../types/revision-journal";

export const revisionJournalService = {
  async getJournal(
    params?: RevisionJournalParams
  ): Promise<PaginatedData<RevisionJournalEntry>> {
    try {
      const response = await api.get<PaginatedData<RevisionJournalEntry>>(
        "/revision-journal/",
        {
          params: {
            page: params?.page,
            page_size: params?.page_size,
            search: params?.search,
            organization: params?.organization,
            locomotive: params?.locomotive,
            no_page: params?.no_page,
            fromDate: params?.fromDate,
            toDate: params?.toDate
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching revision journal:", error);
      throw error;
    }
  },

  async createEntry(
    payload: CreateRevisionJournalPayload
  ): Promise<RevisionJournalEntry> {
    try {
      const response = await api.post<RevisionJournalEntry>(
        "/revision-journal/",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating revision journal entry:", error);
      throw error;
    }
  },

  async updateEntry(
    id: number | string,
    payload: UpdateRevisionJournalPayload
  ): Promise<RevisionJournalEntry> {
    try {
      const response = await api.patch<RevisionJournalEntry>(
        `/revision-journal/${id}/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating revision journal entry:", error);
      throw error;
    }
  },

  async deleteEntry(id: number | string): Promise<void> {
    try {
      await api.delete(`/revision-journal/${id}/`);
    } catch (error) {
      console.error("Error deleting revision journal entry:", error);
      throw error;
    }
  },
};

export default revisionJournalService;

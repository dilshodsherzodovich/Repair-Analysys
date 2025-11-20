import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  PantographJournalEntry,
  PantographJournalParams,
  CreatePantographJournalPayload,
  UpdatePantographJournalPayload,
} from "../types/pantograph";

export const pantographService = {
  async getJournal(
    params?: PantographJournalParams
  ): Promise<PaginatedData<PantographJournalEntry>> {
    try {
      const response = await api.get<PaginatedData<PantographJournalEntry>>(
        "/pantograph-journal/",
        {
          params: {
            page: params?.page,
            page_size: params?.page_size,
            search: params?.search,
            tab: params?.tab,
            no_page: params?.no_page,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching pantograph journal:", error);
      throw error;
    }
  },
  async createEntry(
    payload: CreatePantographJournalPayload
  ): Promise<PantographJournalEntry> {
    try {
      const response = await api.post<PantographJournalEntry>(
        "/pantograph-journal/",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating pantograph journal entry:", error);
      throw error;
    }
  },
  async updateEntry(
    id: number | string,
    payload: UpdatePantographJournalPayload
  ): Promise<PantographJournalEntry> {
    try {
      const response = await api.patch<PantographJournalEntry>(
        `/pantograph-journal/${id}/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating pantograph journal entry:", error);
      throw error;
    }
  },
  async deleteEntry(id: number | string): Promise<void> {
    try {
      await api.delete(`/pantograph-journal/${id}/`);
    } catch (error) {
      console.error("Error deleting pantograph journal entry:", error);
      throw error;
    }
  },
};

export default pantographService;

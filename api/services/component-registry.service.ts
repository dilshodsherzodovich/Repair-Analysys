import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  ComponentRegistryEntry,
  ComponentRegistryParams,
  CreateComponentRegistryPayload,
} from "../types/component-registry";

export const componentRegistryService = {
  async getRegistry(
    params?: ComponentRegistryParams
  ): Promise<PaginatedData<ComponentRegistryEntry>> {
    try {
      const response = await api.get<PaginatedData<ComponentRegistryEntry>>(
        "/component-registry/",
        {
          params: {
            page: params?.page,
            page_size: params?.page_size,
            search: params?.search,
            organization: params?.organization,
            no_page: params?.no_page,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching component registry:", error);
      throw error;
    }
  },

  async createEntry(
    payload: CreateComponentRegistryPayload
  ): Promise<ComponentRegistryEntry> {
    try {
      const response = await api.post<ComponentRegistryEntry>(
        "/component-registry/",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating component registry entry:", error);
      throw error;
    }
  },

  async updateEntry(
    id: number | string,
    payload: CreateComponentRegistryPayload
  ): Promise<ComponentRegistryEntry> {
    try {
      const response = await api.patch<ComponentRegistryEntry>(
        `/component-registry/${id}/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating component registry entry:", error);
      throw error;
    }
  },

  async deleteEntry(id: number | string): Promise<void> {
    try {
      await api.delete(`/component-registry/${id}/`);
    } catch (error) {
      console.error("Error deleting component registry entry:", error);
      throw error;
    }
  },
};


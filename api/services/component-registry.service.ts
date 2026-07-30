import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  ComponentGroupOverview,
  ComponentGroupOverviewParams,
  ComponentGroupDetails,
  ComponentGroupDetailsParams,
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
            locomotive_id: params?.locomotive_id,
            no_page: params?.no_page,
            defect_date_start: params?.defect_date_start || undefined,
            defect_date_end: params?.defect_date_end || undefined,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching component registry:", error);
      throw error;
    }
  },

  /** Every group with its components and defect counts — no registry rows. */
  async getGroupOverview(
    params?: ComponentGroupOverviewParams
  ): Promise<ComponentGroupOverview> {
    try {
      const response = await api.get<ComponentGroupOverview>(
        "/component-registry/by-group-date",
        {
          params: {
            start_date: params?.start_date || undefined,
            end_date: params?.end_date || undefined,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching component group overview:", error);
      throw error;
    }
  },

  /** Registries of one group, split per component. Not paginated. */
  async getByGroupDetails(
    params: ComponentGroupDetailsParams
  ): Promise<ComponentGroupDetails> {
    try {
      const response = await api.get<ComponentGroupDetails>(
        "/component-registry/by-group-details/",
        {
          params: {
            group_id: params.group_id,
            start_date: params.start_date || undefined,
            end_date: params.end_date || undefined,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching component registry by group:", error);
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


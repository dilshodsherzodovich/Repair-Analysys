import api from "../axios";
import {
  Classificator,
  ClassificatorCreateParams,
  ClassificatorGetParams,
  ClassificatorUpdateParams,
} from "../types/classificator";
import { PaginatedData } from "../types/general";

export const classificatorService = {
  getAllClassificators: async (
    params?: ClassificatorGetParams
  ): Promise<PaginatedData<Classificator>> => {
    try {
      const response = await api.get<PaginatedData<Classificator>>(
        "/classificator/all/",
        {
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching classificators:", error);
      throw error;
    }
  },

  createClassificator: async (
    data: ClassificatorCreateParams
  ): Promise<Classificator> => {
    try {
      const response = await api.post<Classificator>(
        "/classificator/create/",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error creating classificator:", error);
      throw error;
    }
  },

  editClassificator: async (
    params: ClassificatorUpdateParams
  ): Promise<Classificator> => {
    try {
      const response = await api.patch<Classificator>(
        `/classificator/${params.id}/`,
        params.data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating classificator:", error);
      throw error;
    }
  },

  deleteClassificator: async (id: string): Promise<void> => {
    try {
      await api.delete(`/classificator/${id}/`);
    } catch (error) {
      console.error("Error deleting classificator:", error);
      throw error;
    }
  },

  bulkDeleteClassificators: async (ids: string[]): Promise<void> => {
    try {
      await api.delete(`/classificator/bulk/`, {
        data: ids,
      });
    } catch (error) {
      console.error("Error deleting classificators:", error);
      throw error;
    }
  },
};

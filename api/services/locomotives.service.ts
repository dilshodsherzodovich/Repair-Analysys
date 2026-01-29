import api from "../axios";
import { PaginatedData } from "../types/general";
import {
  LocomotiveData,
  LocomotiveModelData,
  LocomotiveModelGetParams,
  LokomotiveDataGetParams,
  SortedLocomotiveData,
} from "../types/locomotive";

export const locomotivesService = {
  getLocomotives: async (
    temporaryToken?: string,
    params?: LokomotiveDataGetParams
  ): Promise<PaginatedData<SortedLocomotiveData>> => {
    try {
      const queryParams: LokomotiveDataGetParams = {
        no_page: true,
        ...params,
      };
      const cleanedParams = Object.fromEntries(
        Object.entries(queryParams).filter(([, v]) => v !== undefined)
      ) as LokomotiveDataGetParams;
      const config = {
        ...(temporaryToken && {
          headers: {
            Authorization: `Bearer ${temporaryToken}`,
          },
        }),
        params: cleanedParams,
      };
      const response = await api.get<PaginatedData<SortedLocomotiveData>>(
        "/sorted/locomotives/",
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching locomotives:", error);
      throw error;
    }
  },
  getLocomotiveDetail: async (
    id: number | string
  ): Promise<SortedLocomotiveData> => {
    try {
      const response = await api.get<SortedLocomotiveData>(
        `/sorted/locomotives/${id}/`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching locomotive detail:", error);
      throw error;
    }
  },

  getLocomotiveModels: async (
    params: LocomotiveModelGetParams
  ): Promise<PaginatedData<LocomotiveModelData>> => {
    try {
      const response = await api.get<PaginatedData<LocomotiveModelData>>(
        "/locomotive-models",
        {
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching locomotive models: ", error);
      throw error;
    }
  },
};

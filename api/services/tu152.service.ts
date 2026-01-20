import api from "../axios";
import {
  TU152ListResponse,
  TU152ListParams,
  TU152LocomotiveListResponse,
  TU152LocomotiveModelListResponse,
} from "../types/tu152";

export const tu152Service = {
  async getTU152List(
    params?: TU152ListParams
  ): Promise<TU152ListResponse> {
    try {
      const response = await api.post<TU152ListResponse>(
        "/enakl/tu152/list/",
        {},
        {
          params: {
            p_create_date_from: params?.p_create_date_from,
            p_create_date_to: params?.p_create_date_to,
            p_lokomotiv_id: params?.p_lokomotiv_id,
            p_lokomotiv_seriya_id: params?.p_lokomotiv_seriya_id,
            p_status_id: params?.p_status_id,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching TU152 list:", error);
      throw error;
    }
  },

  async getLocomotives(): Promise<TU152LocomotiveListResponse> {
    try {
      const response = await api.post<TU152LocomotiveListResponse>(
        "/enakl/locomotives/list/"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching TU152 locomotives:", error);
      throw error;
    }
  },

  async getLocomotiveModels(): Promise<TU152LocomotiveModelListResponse> {
    try {
      const response = await api.post<TU152LocomotiveModelListResponse>(
        "/enakl/locomotives/models/list/"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching TU152 locomotive models:", error);
      throw error;
    }
  },

  async updateTU152Entry(
    id: number,
    payload: { status_id: number; answer: string }
  ): Promise<TU152ListResponse> {
    try {
      const response = await api.post<TU152ListResponse>(
        `/enakl/tu152/patch/`,
        {
         parent_id: id,
          ...payload,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating TU152 entry:", error);
      throw error;
    }
  },
};

export default tu152Service;


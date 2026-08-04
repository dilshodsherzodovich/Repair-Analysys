import api from "../axios";
import {
  LocomotiveModel,
  LocomotiveModelParams,
} from "../types/locomotive-model";

export const locomotiveModelsService = {
  getAll: async (params?: LocomotiveModelParams): Promise<LocomotiveModel[]> => {
    const res = await api.get("/locomotive-models/", {
      params: { no_page: true, locomotive_type: params?.locomotive_type },
    });
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
};

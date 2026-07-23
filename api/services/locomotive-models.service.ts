import api from "../axios";
import { LocomotiveModel } from "../types/locomotive-model";

export const locomotiveModelsService = {
  getAll: async (): Promise<LocomotiveModel[]> => {
    const res = await api.get("/locomotive-models/", {
      params: { no_page: true },
    });
    const data: any = res.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
};

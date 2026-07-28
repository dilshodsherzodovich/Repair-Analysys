import api from "../axios";

export interface Branch {
  id: number;
  name: string;
  /** Always present on `/branches/`; the report filters group by it. */
  organization: { id: number; name: string };
}

export const branchesService = {
  getBranches: async (params?: { organization?: number }): Promise<Branch[]> =>
    (await api.get("/branches/", { params })).data,
};

import api from "../axios";
import type {
  LocomotiveMileageBaselineItem,
  LocomotiveMileageBaselinePayload,
} from "../types/locomotive-mileage-baselines";

export const locomotiveMileageBaselinesService = {
  async getList(locomotive: number): Promise<LocomotiveMileageBaselineItem[]> {
    const response = await api.get<LocomotiveMileageBaselineItem[] | { results: LocomotiveMileageBaselineItem[] }>(
      "/locomotive-mileage-baselines/",
      { params: { locomotive } }
    );
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  async create(payload: LocomotiveMileageBaselinePayload): Promise<void> {
    await api.post("/locomotive-mileage-baselines/", payload);
  },

  async update(id: number, payload: LocomotiveMileageBaselinePayload): Promise<void> {
    await api.patch(`/locomotive-mileage-baselines/${id}/`, payload);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/locomotive-mileage-baselines/${id}/`);
  },
};

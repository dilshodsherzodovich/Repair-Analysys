import api from "../axios";
import type {
  TotalMileageBaselineResponse,
  TotalMileageBaselineCreatePayload,
  TotalMileageBaselinePatchPayload,
} from "../types/locomotive-total-mileage-baselines";

export const locomotiveTotalMileageBaselinesService = {
  async get(locomotiveId: number): Promise<TotalMileageBaselineResponse> {
    const response = await api.get<TotalMileageBaselineResponse>(
      "/locomotive-total-mileage-baselines/",
      { params: { locomotive: locomotiveId } }
    );
    return response.data;
  },

  async create(payload: TotalMileageBaselineCreatePayload): Promise<void> {
    await api.post("/locomotive-total-mileage-baselines/", payload);
  },

  async update(id: number, payload: TotalMileageBaselinePatchPayload): Promise<void> {
    await api.patch(`/locomotive-total-mileage-baselines/${id}/`, payload);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/locomotive-total-mileage-baselines/${id}/`);
  },
};

import api from "../axios";
import type {
  LocomotiveMileageBaseline,
  LocomotiveMileageBaselineListResponse,
  LocomotiveMileageBaselineParams,
  LocomotiveMileageBaselinePayload,
} from "../types/locomotive-mileage-baselines";

export const locomotiveMileageBaselinesService = {
  async getList(
    params: LocomotiveMileageBaselineParams
  ): Promise<LocomotiveMileageBaselineListResponse> {
    const response = await api.get<LocomotiveMileageBaselineListResponse>(
      "/locomotive-mileage-baselines/",
      { params }
    );
    return response.data;
  },

  async create(
    payload: LocomotiveMileageBaselinePayload
  ): Promise<LocomotiveMileageBaseline> {
    const response = await api.post<LocomotiveMileageBaseline>(
      "/locomotive-mileage-baselines/",
      payload
    );
    return response.data;
  },

  async update(
    id: number,
    payload: LocomotiveMileageBaselinePayload
  ): Promise<LocomotiveMileageBaseline> {
    const response = await api.patch<LocomotiveMileageBaseline>(
      `/locomotive-mileage-baselines/${id}/`,
      payload
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/locomotive-mileage-baselines/${id}/`);
  },
};

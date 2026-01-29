import api from "../axios";
import { SpecialComponent } from "../types/locomotive";

export const specialComponentsService = {
  async updateSpecialComponent(
    id: number,
    payload: Partial<Omit<SpecialComponent, "id" | "year_of_manufacture" | "factory_number">>
  ): Promise<SpecialComponent> {
    try {
      const response = await api.patch<SpecialComponent>(
        `/special-components-values/${id}/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating special component:", error);
      throw error;
    }
  },
};


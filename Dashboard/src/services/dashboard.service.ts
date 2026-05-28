import { api } from "@/services/api";
import type { DashboardSummaryResponse } from "@/types/api";

export const dashboardService = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const { data } = await api.get<DashboardSummaryResponse>("/dashboard/summary");
    return data;
  },
};

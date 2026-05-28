import { api } from "@/services/api";
import type { DashboardMetrics } from "@/types/api";

export const analyticsService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const { data } = await api.get<DashboardMetrics>("/analytics/metrics");
    return data;
  },
};

import { dashboardService } from "@/services/dashboard.service";
import { toProviderStats } from "@/services/session.service";

export const providerService = {
  async getProviderMetrics() {
    const summary = await dashboardService.getSummary();
    return toProviderStats(summary.latest);
  },
};

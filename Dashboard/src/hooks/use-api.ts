import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { threatService } from "@/services/threat.service";
import { analyticsService } from "@/services/analytics.service";
import { providerService } from "@/services/provider.service";
import { toTimeline } from "@/services/session.service";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: dashboardService.getSummary,
    refetchInterval: 15_000,
  });
}

export function useThreatFeed(limit = 80) {
  return useQuery({
    queryKey: ["threat-feed", limit],
    queryFn: () => threatService.getThreatFeed(limit),
    refetchInterval: 10_000,
  });
}

export function useAnalyticsMetrics() {
  return useQuery({
    queryKey: ["analytics-metrics"],
    queryFn: analyticsService.getMetrics,
    refetchInterval: 20_000,
  });
}

export function useProviderMetrics() {
  return useQuery({
    queryKey: ["provider-metrics"],
    queryFn: providerService.getProviderMetrics,
    refetchInterval: 20_000,
  });
}

export function useTimeline(limit = 120) {
  const feed = useThreatFeed(limit);
  const timeline = useMemo(() => toTimeline(feed.data ?? []), [feed.data]);
  return { ...feed, timeline };
}

export function useAnalyzeMutation() {
  return useMutation({ mutationFn: threatService.analyze });
}

export function useChatMutation() {
  return useMutation({ mutationFn: threatService.chat });
}

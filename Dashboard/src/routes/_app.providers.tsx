import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/aegis/page-header";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { CHART_COLORS, tooltipStyle } from "@/components/aegis/chart-theme";
import { Server } from "lucide-react";
import { useMemo } from "react";
import { useProviderMetrics, useTimeline } from "@/hooks/use-api";

export const Route = createFileRoute("/_app/providers")({
  head: () => ({ meta: [{ title: "Providers — Aegisflow" }] }),
  component: ProvidersPage,
});

function ProvidersPage() {
  const { data: providerMetrics } = useProviderMetrics();
  const { timeline } = useTimeline(120);
  const sparks = useMemo(() => (providerMetrics ?? []).map(() => timeline), [providerMetrics, timeline]);
  return (
    <div className="space-y-6">
      <PageHeader title="Providers" description="Upstream LLM provider health, latency, and throughput." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(providerMetrics ?? []).map((p, i) => (
          <Card key={p.provider} className="glass relative overflow-hidden p-5 animate-in-up">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{p.provider}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">upstream</p>
                </div>
              </div>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " +
                  (p.status === "healthy"
                    ? "bg-[oklch(0.72_0.17_165/0.15)] text-[oklch(0.82_0.17_165)] border-[oklch(0.72_0.17_165/0.4)]"
                    : "bg-[oklch(0.78_0.17_75/0.15)] text-[oklch(0.85_0.17_75)] border-[oklch(0.78_0.17_75/0.4)]")
                }
              >
                <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
                {p.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-right font-mono">{p.uptime}%</span>
              <span className="text-muted-foreground">Latency</span>
              <span className="text-right font-mono">{p.latency}ms</span>
              <span className="text-muted-foreground">RPM</span>
              <span className="text-right font-mono">{p.rpm.toLocaleString()}</span>
              <span className="text-muted-foreground">Failure rate</span>
              <span className="text-right font-mono">{p.failures}%</span>
              <span className="text-muted-foreground">Blocked</span>
              <span className="text-right font-mono">{p.blocked}</span>
            </div>
            <div className="mt-3 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparks[i]}>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="requests" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
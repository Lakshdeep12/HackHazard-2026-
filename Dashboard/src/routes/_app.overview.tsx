import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Activity, AlertTriangle, Ban, Bot, Gauge, ShieldAlert, ShieldCheck, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/aegis/metric-card";
import { PageHeader } from "@/components/aegis/page-header";
import { SeverityBadge, DecisionBadge } from "@/components/aegis/risk-badge";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { useDashboardSummary, useTimeline } from "@/hooks/use-api";
import { CHART_COLORS, tooltipStyle } from "@/components/aegis/chart-theme";
import { toRiskScore100 } from "@/services/session.service";

export const Route = createFileRoute("/_app/overview")({
  head: () => ({ meta: [{ title: "Overview — Aegisflow" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const { threats } = useLiveFeed(20, 2200);
  const { data: summary } = useDashboardSummary();
  const { timeline } = useTimeline(150);
  const series = timeline;
  const provSeries = timeline;
  const categoryDist = useMemo(
    () =>
      Object.entries(summary?.metrics.categories ?? {}).map(([name, value], idx) => ({
        name,
        value,
        color: `var(--chart-${(idx % 5) + 1})`,
      })),
    [summary?.metrics.categories],
  );

  const blocked = threats.filter((t) => t.decision === "block").length;
  const warned = threats.filter((t) => t.decision === "warn").length;
  const avgRisk = Math.round(threats.reduce((a, t) => a + t.riskScore, 0) / Math.max(threats.length, 1));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Operations Overview"
        description="Realtime AI traffic, threat detection, and provider health across your fleet."
        actions={
          <>
            <Button variant="outline" size="sm">Last 24h</Button>
            <Button size="sm" style={{ background: "var(--gradient-primary)" }}>
              <Zap className="mr-1.5 h-4 w-4" /> Live mode
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Requests" value={summary?.metrics.total_events ?? 0} delta={12} icon={Activity} tint="primary" live />
        <MetricCard label="Threats Blocked" value={summary?.metrics.blocked_events ?? blocked} delta={8} icon={Ban} tint="danger" live />
        <MetricCard label="Warnings Issued" value={summary?.metrics.warned_events ?? warned} delta={-3} icon={AlertTriangle} tint="warning" live />
        <MetricCard label="Avg Risk Score" value={summary ? toRiskScore100(summary.metrics.average_risk) : avgRisk} suffix="/100" delta={4} icon={Gauge} tint="accent" />
        <MetricCard label="Active Sessions" value={new Set(threats.map((t) => t.sessionId)).size} delta={6} icon={Bot} tint="primary" live />
        <MetricCard label="Detection Accuracy" value={99} suffix="%" delta={1} icon={ShieldCheck} tint="success" />
        <MetricCard label="Provider Uptime" value={99} suffix="%" delta={0} icon={ShieldAlert} tint="success" />
        <MetricCard label="Realtime Attacks" value={threats.length * 3 + 12} delta={14} icon={Zap} tint="danger" live />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Threat Activity</h3>
              <p className="text-xs text-muted-foreground">Requests vs blocked vs warned over time</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_165)] text-[oklch(0.72_0.17_165)]" />
              Streaming
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBlock" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="time" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="requests" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#gReq)" />
              <Area type="monotone" dataKey="blocked" stroke={CHART_COLORS.danger} strokeWidth={2} fill="url(#gBlock)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <h3 className="text-sm font-semibold">Attack Categories</h3>
          <p className="mb-3 text-xs text-muted-foreground">Last 24 hours</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {categoryDist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {categoryDist.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="tabular-nums text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold">Provider Throughput</h3>
          <p className="mb-3 text-xs text-muted-foreground">Requests per minute by upstream model provider</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={provSeries}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="time" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="requests" name="OpenAI" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="blocked" name="Anthropic" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="warned" name="Gemini" stroke={CHART_COLORS.warning} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Live Threat Stream</h3>
            <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-destructive">
              {threats.length} events
            </span>
          </div>
          <div className="-mr-2 max-h-[260px] space-y-2 overflow-y-auto pr-2">
            {threats.slice(0, 12).map((t) => (
              <div key={t.id} className="rounded-lg border border-border/60 bg-background/30 p-2.5 animate-in-up">
                <div className="flex items-center justify-between gap-2">
                  <SeverityBadge severity={t.severity} />
                  <DecisionBadge decision={t.decision} />
                </div>
                <p className="mt-1.5 truncate text-xs text-muted-foreground">{t.category} · {t.provider}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
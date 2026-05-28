import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Area, AreaChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/aegis/page-header";
import { useAnalyticsMetrics, useTimeline } from "@/hooks/use-api";
import { CHART_COLORS, tooltipStyle } from "@/components/aegis/chart-theme";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Aegisflow" }] }),
  component: AnalyticsPage,
});

const HOURLY = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  threats: Math.round(20 + Math.sin(h / 3) * 18 + Math.random() * 14),
  allowed: Math.round(120 + Math.cos(h / 4) * 30 + Math.random() * 20),
}));

const GEO = [
  { region: "North America", value: 4820 },
  { region: "Europe", value: 3140 },
  { region: "Asia Pacific", value: 2780 },
  { region: "South America", value: 920 },
  { region: "Africa", value: 410 },
  { region: "Middle East", value: 380 },
];

function AnalyticsPage() {
  const { data: metrics } = useAnalyticsMetrics();
  const { timeline } = useTimeline(200);
  const trend = timeline;
  const categoryDist = useMemo(
    () =>
      Object.entries(metrics?.categories ?? {}).map(([name, value], idx) => ({
        name,
        value,
        color: `var(--chart-${(idx % 5) + 1})`,
      })),
    [metrics?.categories],
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Trends, distributions, and operational metrics across all traffic."
        actions={
          <>
            <Button variant="outline" size="sm">Last 7 days</Button>
            <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />CSV</Button>
            <Button size="sm" style={{ background: "var(--gradient-primary)" }}>
              <Download className="mr-1.5 h-3.5 w-3.5" />PDF report
            </Button>
          </>
        }
      />

      <Card className="glass p-5">
        <h3 className="text-sm font-semibold">Attack Trends</h3>
        <p className="mb-3 text-xs text-muted-foreground">Blocked vs allowed traffic over 48 hours</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="aReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aBlk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.4} />
                <stop offset="100%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="time" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area name="Allowed" type="monotone" dataKey="requests" stroke={CHART_COLORS.primary} fill="url(#aReq)" strokeWidth={2} />
            <Area name="Blocked" type="monotone" dataKey="blocked" stroke={CHART_COLORS.danger} fill="url(#aBlk)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass p-5">
          <h3 className="text-sm font-semibold">Hourly Threat Activity</h3>
          <p className="mb-3 text-xs text-muted-foreground">Threats detected by hour-of-day</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={HOURLY}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="hour" stroke={CHART_COLORS.axis} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="threats" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <h3 className="text-sm font-semibold">Geographic Distribution</h3>
          <p className="mb-3 text-xs text-muted-foreground">Threats by region (last 30d)</p>
          <div className="space-y-2.5">
            {GEO.map((g) => {
              const max = Math.max(...GEO.map((x) => x.value));
              const pct = (g.value / max) * 100;
              return (
                <div key={g.region}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{g.region}</span>
                    <span className="tabular-nums text-muted-foreground">{g.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="glass p-5">
        <h3 className="text-sm font-semibold">Attack Category Breakdown</h3>
        <p className="mb-3 text-xs text-muted-foreground">Top categories detected this period</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categoryDist} layout="vertical">
            <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
            <XAxis type="number" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" stroke={CHART_COLORS.axis} fontSize={11} width={120} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {categoryDist.map((c, i) => <Cell key={i} fill={c.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
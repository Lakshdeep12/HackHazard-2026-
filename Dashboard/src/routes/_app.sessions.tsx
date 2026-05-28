import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/aegis/page-header";
import { SeverityBadge } from "@/components/aegis/risk-badge";
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { CHART_COLORS, tooltipStyle } from "@/components/aegis/chart-theme";
import { ChevronRight, Clock } from "lucide-react";
import { useThreatFeed } from "@/hooks/use-api";
import { toSessionRows, toTimeline, toSeverity } from "@/services/session.service";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({ meta: [{ title: "Sessions — Aegisflow" }] }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data } = useThreatFeed(160);
  const sessions = toSessionRows(data ?? []);
  const escalation = toTimeline(data ?? []).map((x, i) => ({ turn: `T${i + 1}`, risk: Math.min(100, Math.round((x.blocked / Math.max(x.requests, 1)) * 100)) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Multi-turn conversation analysis with cumulative risk scoring and escalation detection."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass p-0 lg:col-span-2">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Active Sessions</h3>
          </div>
          <div className="divide-y divide-border">
            {sessions.map((s) => {
              const sev = toSeverity(s.risk);
              return (
                <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-background/30">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-mono text-sm">{s.id}</p>
                      <SeverityBadge severity={sev as any} />
                      {s.suspicious && (
                        <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-destructive">
                          suspicious
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.user} · {s.turns} turns · {s.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{s.risk}<span className="text-muted-foreground">/100</span></p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">accumulated</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="text-sm font-semibold">Risk Escalation</h3>
          <p className="mb-3 text-xs text-muted-foreground">Cumulative risk per turn (selected session)</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={escalation}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="turn" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="risk" stroke={CHART_COLORS.accent} strokeWidth={2.5} dot={{ r: 3, fill: CHART_COLORS.accent }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs">
            <p className="font-medium text-destructive">Escalation detected</p>
            <p className="mt-1 text-muted-foreground">
              Risk crossed 75 at turn T9 — adversarial mutation pattern.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
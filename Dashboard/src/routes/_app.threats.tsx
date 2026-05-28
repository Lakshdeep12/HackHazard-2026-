import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter, Pause, Play, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/aegis/page-header";
import { SeverityBadge, DecisionBadge } from "@/components/aegis/risk-badge";
import { useLiveFeed } from "@/hooks/use-live-feed";
import type { Severity } from "@/types/api";
import { LoadingState } from "@/components/aegis/loading-state";
import { ErrorState } from "@/components/aegis/error-state";

export const Route = createFileRoute("/_app/threats")({
  head: () => ({ meta: [{ title: "Threat Feed — Aegisflow" }] }),
  component: ThreatsPage,
});

function ThreatsPage() {
  const { threats, paused, setPaused, isLoading, isError } = useLiveFeed(80, 1800);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<Severity | "all">("all");

  const filtered = useMemo(
    () =>
      threats.filter(
        (t) =>
          (sev === "all" || t.severity === sev) &&
          (q === "" ||
            t.category.includes(q.toLowerCase()) ||
            t.requestId.includes(q) ||
            t.sessionId.includes(q)),
      ),
    [threats, q, sev],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Threat Feed"
        description="Realtime stream of analyzed requests across the AI gateway."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setPaused(!paused)}>
              {paused ? <Play className="mr-1.5 h-3.5 w-3.5" /> : <Pause className="mr-1.5 h-3.5 w-3.5" />}
              {paused ? "Resume" : "Pause"} stream
            </Button>
            <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
          </>
        }
      />

      <Card className="glass overflow-hidden">
        {isLoading && <div className="p-3"><LoadingState rows={6} /></div>}
        {isError && <div className="p-3"><ErrorState /></div>}
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by category, request id, session id…"
              className="h-9 pl-9"
            />
          </div>
          <Select value={sev} onValueChange={(v) => setSev(v as Severity | "all")}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Filter className="mr-1.5 h-3.5 w-3.5" />More</Button>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_165)] text-[oklch(0.72_0.17_165)]" />
            {filtered.length} events {paused && "(paused)"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Severity</th>
                <th className="px-4 py-2.5 text-left font-medium">Time</th>
                <th className="px-4 py-2.5 text-left font-medium">Request</th>
                <th className="px-4 py-2.5 text-left font-medium">Session</th>
                <th className="px-4 py-2.5 text-left font-medium">Category</th>
                <th className="px-4 py-2.5 text-left font-medium">Provider</th>
                <th className="px-4 py-2.5 text-left font-medium">Risk</th>
                <th className="px-4 py-2.5 text-left font-medium">Decision</th>
                <th className="px-4 py-2.5 text-left font-medium">Signals</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-border/60 hover:bg-background/40 animate-in-up">
                  <td className="px-4 py-2.5"><SeverityBadge severity={t.severity} /></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{t.requestId}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{t.sessionId}</td>
                  <td className="px-4 py-2.5 text-xs">{t.category}</td>
                  <td className="px-4 py-2.5 text-xs capitalize">{t.provider}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${t.riskScore}%`,
                            background:
                              t.riskScore >= 75
                                ? "var(--danger)"
                                : t.riskScore >= 45
                                ? "var(--warning)"
                                : "var(--success)",
                          }}
                        />
                      </div>
                      <span className="tabular-nums text-xs">{t.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><DecisionBadge decision={t.decision} /></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.signals.length} signals</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
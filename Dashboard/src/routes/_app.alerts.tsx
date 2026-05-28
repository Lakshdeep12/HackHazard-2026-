import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/aegis/page-header";
import { SeverityBadge } from "@/components/aegis/risk-badge";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { BellRing, Check } from "lucide-react";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alerts — Aegisflow" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { threats } = useLiveFeed(40, 3000);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    const critical = threats.find((t) => t.severity === "critical");
    if (critical && critical.id !== lastId.current) {
      lastId.current = critical.id;
      toast.error(`Critical: ${critical.category}`, {
        description: `Session ${critical.sessionId} · risk ${critical.riskScore}/100`,
      });
    }
  }, [threats]);

  const alerts = threats.filter((t) => t.severity === "critical" || t.severity === "high");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts Center"
        description="Realtime SOC alerts with acknowledgment, analyst notes, and history."
        actions={
          <Button size="sm" variant="outline">
            <Check className="mr-1.5 h-3.5 w-3.5" /> Acknowledge all
          </Button>
        }
      />
      <Card className="glass p-0">
        <div className="divide-y divide-border">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-start gap-4 p-4 animate-in-up">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/15 text-destructive">
                <BellRing className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={a.severity} />
                  <span className="text-sm font-medium">{a.category}</span>
                  <span className="text-xs text-muted-foreground">· {a.provider}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {a.sessionId} · risk {a.riskScore}/100 · {a.signals.length} signals
                </p>
              </div>
              <Button size="sm" variant="ghost">Ack</Button>
              <Button size="sm" variant="outline">Investigate</Button>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No high-severity alerts in the current window.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
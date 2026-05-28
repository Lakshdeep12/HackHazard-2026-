import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/aegis/page-header";
import { Download, Search } from "lucide-react";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — Aegisflow" }] }),
  component: AuditPage,
});

const LOGS = [
  { ts: "2026-05-28 14:02:11", actor: "alex@aegisflow.io", role: "admin", action: "policy.update", target: "regex.customer-pii-leak", ip: "10.0.4.21" },
  { ts: "2026-05-28 13:51:42", actor: "system", role: "system", action: "detector.tune", target: "embedding_v4", ip: "—" },
  { ts: "2026-05-28 13:33:08", actor: "rin@globex.dev", role: "analyst", action: "alert.acknowledge", target: "alert_98ab12", ip: "172.18.9.4" },
  { ts: "2026-05-28 13:10:55", actor: "alex@aegisflow.io", role: "admin", action: "apikey.rotate", target: "key_prod_3", ip: "10.0.4.21" },
  { ts: "2026-05-28 12:48:30", actor: "kai@initech.com", role: "viewer", action: "report.export", target: "analytics-7d.csv", ip: "192.168.41.7" },
  { ts: "2026-05-28 12:31:01", actor: "system", role: "system", action: "provider.failover", target: "gemini → openai", ip: "—" },
];

function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of administrative and system events for compliance."
        actions={<Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>}
      />
      <Card className="glass overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search actor, action, target…" className="h-9 pl-9" />
          </div>
          <Button variant="outline" size="sm">Last 7 days</Button>
          <Button variant="outline" size="sm">All roles</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Timestamp</th>
                <th className="px-4 py-2.5 text-left font-medium">Actor</th>
                <th className="px-4 py-2.5 text-left font-medium">Role</th>
                <th className="px-4 py-2.5 text-left font-medium">Action</th>
                <th className="px-4 py-2.5 text-left font-medium">Target</th>
                <th className="px-4 py-2.5 text-left font-medium">Source IP</th>
              </tr>
            </thead>
            <tbody>
              {LOGS.map((l, i) => (
                <tr key={i} className="border-t border-border/60 hover:bg-background/40">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{l.ts}</td>
                  <td className="px-4 py-2.5 text-xs">{l.actor}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {l.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{l.action}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{l.target}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
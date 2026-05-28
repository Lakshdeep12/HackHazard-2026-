import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/aegis/page-header";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/policies")({
  head: () => ({ meta: [{ title: "Policies — Aegisflow" }] }),
  component: PoliciesPage,
});

const DETECTORS = [
  { id: "regex", name: "Regex Pattern Engine", desc: "Pattern-based instruction override detection", on: true },
  { id: "semantic", name: "Semantic Similarity", desc: "Embedding-space jailbreak cluster matching", on: true },
  { id: "embed", name: "Adversarial Mutation", desc: "Detects perturbations of known attack vectors", on: true },
  { id: "encoding", name: "Encoding Decoder", desc: "Decodes base64/hex/unicode confusables", on: true },
  { id: "behavior", name: "Behavioral Heuristics", desc: "Cross-turn escalation and repeat probes", on: false },
];

function PoliciesPage() {
  const [threshold, setThreshold] = useState([75]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Management"
        description="Configure detectors, thresholds, and routing rules across your gateway."
        actions={<Button size="sm" style={{ background: "var(--gradient-primary)" }}><Plus className="mr-1.5 h-3.5 w-3.5" />New policy</Button>}
      />

      <Card className="glass p-5">
        <h3 className="mb-1 text-sm font-semibold">Detectors</h3>
        <p className="mb-4 text-xs text-muted-foreground">Enable, disable, or tune individual detection engines.</p>
        <div className="space-y-3">
          {DETECTORS.map((d) => (
            <div key={d.id} className="flex items-start gap-4 rounded-lg border border-border bg-background/30 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
              </div>
              <Switch defaultChecked={d.on} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass p-5">
          <h3 className="text-sm font-semibold">Block Threshold</h3>
          <p className="mb-4 text-xs text-muted-foreground">Aggregate risk score that triggers a hard block.</p>
          <div className="space-y-3">
            <Slider value={threshold} onValueChange={setThreshold} max={100} step={1} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Permissive</span>
              <span className="font-mono text-base text-foreground">{threshold[0]}</span>
              <span>Strict</span>
            </div>
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="text-sm font-semibold">Custom Regex Rule</h3>
          <p className="mb-4 text-xs text-muted-foreground">Add a project-specific blocklist pattern.</p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="rule">Name</Label>
              <Input id="rule" defaultValue="customer-pii-leak" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="pattern">Pattern</Label>
              <Textarea id="pattern" defaultValue="\\b(?:ssn|social[-_ ]?security)\\b" className="mt-1 font-mono text-xs" />
            </div>
            <Button size="sm" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" />Add rule</Button>
          </div>
        </Card>
      </div>

      <Card className="glass p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Provider Routing Rules</h3>
            <p className="text-xs text-muted-foreground">Direct requests to specific upstreams based on conditions.</p>
          </div>
          <Button size="sm" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" />Add rule</Button>
        </div>
        <div className="divide-y divide-border">
          {[
            { when: "risk_score < 30", then: "openai/gpt-4o-mini" },
            { when: "category = 'pii-leak'", then: "local/llama-3-guard" },
            { when: "region = 'EU'", then: "anthropic/claude-haiku-eu" },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <code className="rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-xs">{r.when}</code>
              <span className="text-xs text-muted-foreground">→</span>
              <code className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">{r.then}</code>
              <Button size="icon" variant="ghost" className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
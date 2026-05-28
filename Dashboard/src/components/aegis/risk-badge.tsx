import { cn } from "@/lib/utils";
import type { Decision, Severity } from "@/types/api";

const SEV_STYLES: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/40",
  high: "bg-[oklch(0.78_0.17_75/0.15)] text-[oklch(0.85_0.17_75)] border-[oklch(0.78_0.17_75/0.35)]",
  medium: "bg-[oklch(0.78_0.13_85/0.10)] text-[oklch(0.85_0.13_85)] border-[oklch(0.78_0.13_85/0.30)]",
  low: "bg-primary/15 text-primary border-primary/40",
};

const DECISION_STYLES: Record<Decision, string> = {
  allow: "bg-[oklch(0.72_0.17_165/0.15)] text-[oklch(0.82_0.17_165)] border-[oklch(0.72_0.17_165/0.4)]",
  warn: "bg-[oklch(0.78_0.17_75/0.15)] text-[oklch(0.85_0.17_75)] border-[oklch(0.78_0.17_75/0.4)]",
  block: "bg-destructive/15 text-destructive border-destructive/40",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        SEV_STYLES[severity],
      )}
    >
      <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        DECISION_STYLES[decision],
      )}
    >
      {decision}
    </span>
  );
}
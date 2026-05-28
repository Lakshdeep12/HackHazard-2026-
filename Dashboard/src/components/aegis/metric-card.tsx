import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAnimatedNumber } from "@/hooks/use-live-feed";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
  icon: LucideIcon;
  tint?: "primary" | "success" | "warning" | "danger" | "accent";
  live?: boolean;
}

const TINT: Record<NonNullable<MetricCardProps["tint"]>, string> = {
  primary: "text-primary",
  success: "text-[oklch(0.78_0.17_165)]",
  warning: "text-[oklch(0.85_0.17_75)]",
  danger: "text-destructive",
  accent: "text-accent",
};

export function MetricCard({ label, value, suffix, delta, icon: Icon, tint = "primary", live }: MetricCardProps) {
  const animated = useAnimatedNumber(value);
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className="glass relative overflow-hidden p-5 animate-in-up">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tabular-nums">
            {animated.toLocaleString()}
            {suffix && <span className="ml-1 text-base text-muted-foreground">{suffix}</span>}
          </p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/40", TINT[tint])}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5",
              positive
                ? "bg-[oklch(0.72_0.17_165/0.15)] text-[oklch(0.82_0.17_165)]"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}%
          </span>
        )}
        {live && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_165)] text-[oklch(0.72_0.17_165)]" />
            live
          </span>
        )}
      </div>
    </Card>
  );
}
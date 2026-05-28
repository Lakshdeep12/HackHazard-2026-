import { ShieldCheck } from "lucide-react";

export function AegisLogo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid place-items-center rounded-lg"
        style={{
          width: size + 8,
          height: size + 8,
          background: "var(--gradient-primary)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        <ShieldCheck size={size - 6} className="text-primary-foreground" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-tight">Aegisflow</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          AI Security Gateway
        </span>
      </div>
    </div>
  );
}
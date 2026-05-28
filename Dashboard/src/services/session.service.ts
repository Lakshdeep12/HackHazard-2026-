import type { ThreatEvent } from "@/types/api";

export function toRiskScore100(risk: number): number {
  return Math.max(0, Math.min(100, Math.round(risk * 100)));
}

export function toSeverity(risk: number): "critical" | "high" | "medium" | "low" {
  const score = risk <= 1 ? toRiskScore100(risk) : risk;
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function toTimeline(events: ThreatEvent[]) {
  const byMinute = new Map<string, { time: string; requests: number; blocked: number; warned: number }>();
  for (const event of events) {
    const d = new Date(event.created_at);
    const key = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    const current = byMinute.get(key) ?? { time: key, requests: 0, blocked: 0, warned: 0 };
    current.requests += 1;
    if (event.decision === "block") current.blocked += 1;
    if (event.decision === "warn") current.warned += 1;
    byMinute.set(key, current);
  }
  return Array.from(byMinute.values()).slice(-30);
}

export function toSessionRows(events: ThreatEvent[]) {
  const map = new Map<string, { id: string; turns: number; risk: number; suspicious: boolean; duration: string; user: string }>();
  for (const event of events) {
    const risk = toRiskScore100(event.risk_score);
    const entry = map.get(event.session_id) ?? {
      id: event.session_id,
      turns: 0,
      risk: 0,
      suspicious: false,
      duration: "1m",
      user: "unknown@tenant.local",
    };
    entry.turns += 1;
    entry.risk = Math.max(entry.risk, risk);
    entry.suspicious = entry.suspicious || risk > 80 || event.decision === "block";
    map.set(event.session_id, entry);
  }
  return Array.from(map.values()).slice(0, 20);
}

export function toProviderStats(events: ThreatEvent[]) {
  const map = new Map<string, { provider: string; uptime: number; latency: number; rpm: number; failures: number; blocked: number; status: "healthy" | "degraded" }>();
  for (const event of events) {
    const key = event.provider.toString();
    const row = map.get(key) ?? { provider: key, uptime: 99.5, latency: 220, rpm: 0, failures: 0, blocked: 0, status: "healthy" };
    row.rpm += 1;
    if (event.decision === "block") row.blocked += 1;
    map.set(key, row);
  }
  return Array.from(map.values()).map((row) => ({
    ...row,
    status: row.failures > 1 ? "degraded" : "healthy",
  }));
}

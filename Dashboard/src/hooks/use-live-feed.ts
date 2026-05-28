import { useEffect, useMemo, useState } from "react";
import { useThreatFeed } from "@/hooks/use-api";
import { useWebsocketStore } from "@/stores/websocket-store";
import type { Decision, Severity, ThreatEvent } from "@/types/api";
import { toRiskScore100, toSeverity } from "@/services/session.service";

export interface Threat {
  id: string;
  requestId: string;
  sessionId: string;
  timestamp: number;
  riskScore: number;
  category: string;
  provider: string;
  decision: Decision;
  severity: Severity;
  signals: string[];
  prompt: string;
  sanitized: string;
  reasoning: string;
}

function mapThreat(event: ThreatEvent): Threat {
  const risk = toRiskScore100(event.risk_score);
  const signalKeys = Object.keys(event.signals ?? {});
  return {
    id: `t_${event.id}`,
    requestId: `req_${event.id}`,
    sessionId: event.session_id,
    timestamp: new Date(event.created_at).getTime(),
    riskScore: risk,
    category: event.category,
    provider: event.provider,
    decision: event.decision,
    severity: toSeverity(risk),
    signals: signalKeys,
    prompt: event.prompt,
    sanitized: event.prompt,
    reasoning: event.reasons.join(" · "),
  };
}

export function useLiveFeed(max = 50, intervalMs = 2500) {
  const { data, isLoading, isError, refetch } = useThreatFeed(Math.max(max, 50));
  const wsThreats = useWebsocketStore((s) => s.latestThreats);
  const connect = useWebsocketStore((s) => s.connect);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      void refetch();
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, intervalMs, refetch]);

  const threats = useMemo(() => {
    const combined = [...(wsThreats ?? []), ...(data ?? [])];
    const deduped = new Map<number, ThreatEvent>();
    for (const item of combined) deduped.set(item.id, item);
    return Array.from(deduped.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, max)
      .map(mapThreat);
  }, [data, max, wsThreats]);

  return { threats, paused, setPaused, isLoading, isError };
}

export function useAnimatedNumber(target: number, durationMs = 800) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const start = value;
    const delta = target - start;
    const startTime = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}
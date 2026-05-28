export type Decision = "allow" | "warn" | "block";
export type Severity = "critical" | "high" | "medium" | "low";
export type Provider = "openai" | "anthropic" | "gemini" | "local";
export type WsStatus = "connecting" | "live" | "disconnected";

export interface ApiErrorResponse {
  detail?: string | { message?: string };
  message?: string;
}

export interface HealthResponse {
  status: string;
}

export interface ReadyResponse {
  status: "ready" | "not_ready";
  checks: Record<string, string>;
}

export interface ThreatEvent {
  id: number;
  session_id: string;
  provider: Provider | string;
  prompt: string;
  decision: Decision;
  risk_score: number; // 0..1 from backend
  category: string;
  reasons: string[];
  signals: Record<string, unknown>;
  created_at: string;
}

export interface DetectionSignal {
  name: string;
  score: number;
  detail: string;
}

export interface AnalyzeRequest {
  prompt: string;
  session_id: string;
  provider: Provider;
}

export interface AnalyzeResponse {
  decision: Decision;
  risk_score: number;
  category: string;
  reasons: string[];
  signals: DetectionSignal[];
  session_id: string;
  request_id: string;
}

export interface ChatRequest extends AnalyzeRequest {
  forward_if_safe?: boolean;
}

export interface ChatResponse {
  analysis: AnalyzeResponse;
  provider: string;
  output: string | null;
  blocked: boolean;
  metadata: Record<string, unknown>;
}

export interface DashboardMetrics {
  total_events: number;
  blocked_events: number;
  warned_events: number;
  allowed_events: number;
  average_risk: number;
  categories: Record<string, number>;
}

export interface DashboardSummaryResponse {
  metrics: DashboardMetrics;
  latest: ThreatEvent[];
}

export interface SeedVectorsResponse {
  threat_vectors: number;
}

export interface IndexMutationsRequest {
  prompt: string;
  category?: string;
}

export interface IndexMutationsResponse {
  mutations_indexed: number;
}

export interface WebSocketEvent {
  type: "threat.blocked" | "threat.warned" | "threat.allowed" | "dashboard.update";
  payload: Record<string, unknown>;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  role: "admin" | "analyst" | "viewer";
  user: {
    id: string;
    name: string;
    email: string;
  };
  apiKey?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

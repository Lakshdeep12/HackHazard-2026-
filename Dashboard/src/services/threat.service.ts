import { api } from "@/services/api";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ChatRequest,
  ChatResponse,
  IndexMutationsRequest,
  IndexMutationsResponse,
  SeedVectorsResponse,
  ThreatEvent,
} from "@/types/api";

export const threatService = {
  async getThreatFeed(limit = 50): Promise<ThreatEvent[]> {
    const { data } = await api.get<ThreatEvent[]>("/threat-feed", { params: { limit } });
    return data;
  },
  async analyze(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
    const { data } = await api.post<AnalyzeResponse>("/analyze", payload);
    return data;
  },
  async chat(payload: ChatRequest): Promise<ChatResponse> {
    const { data } = await api.post<ChatResponse>("/chat", payload);
    return data;
  },
  async seedVectors(): Promise<SeedVectorsResponse> {
    const { data } = await api.post<SeedVectorsResponse>("/admin/seed-vectors");
    return data;
  },
  async indexMutations(payload: IndexMutationsRequest): Promise<IndexMutationsResponse> {
    const { data } = await api.post<IndexMutationsResponse>("/admin/index-mutations", payload);
    return data;
  },
};

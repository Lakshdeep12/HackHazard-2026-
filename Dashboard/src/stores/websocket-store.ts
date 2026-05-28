import { create } from "zustand";
import type { ThreatEvent, WebSocketEvent, WsStatus } from "@/types/api";
import { AlertsWebSocketClient } from "@/services/websocket.service";
import { toast } from "sonner";

interface WebSocketStoreState {
  status: WsStatus;
  alerts: WebSocketEvent[];
  latestThreats: ThreatEvent[];
  connect: () => void;
  disconnect: () => void;
}

const client = new AlertsWebSocketClient();

export const useWebsocketStore = create<WebSocketStoreState>((set) => ({
  status: "disconnected",
  alerts: [],
  latestThreats: [],
  connect() {
    client.connect(
      (event) => {
        set((state) => {
          const alerts = [event, ...state.alerts].slice(0, 100);
          const nextThreats = [...state.latestThreats];
          const payload = event.payload as { event?: ThreatEvent; category?: string; decision?: string };
          if (payload.event) {
            nextThreats.unshift(payload.event);
          }
          if (event.type.startsWith("threat.")) {
            toast(event.type.replace("threat.", "").toUpperCase(), {
              description: payload.category ?? "Threat event received",
            });
          }
          return {
            alerts,
            latestThreats: nextThreats.slice(0, 100),
          };
        });
      },
      (status) => set({ status }),
    );
  },
  disconnect() {
    client.disconnect();
    set({ status: "disconnected" });
  },
}));

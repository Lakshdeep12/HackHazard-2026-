import type { WebSocketEvent, WsStatus } from "@/types/api";

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  import.meta.env.NEXT_PUBLIC_WS_URL ??
  "ws://localhost:8000/api/v1/ws/alerts";

type Listener = (event: WebSocketEvent) => void;
type StatusListener = (status: WsStatus) => void;

export class AlertsWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private listener: Listener | null = null;
  private statusListener: StatusListener | null = null;

  connect(listener: Listener, onStatusChange: StatusListener) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.listener = listener;
    this.statusListener = onStatusChange;
    this.open();
  }

  disconnect() {
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.statusListener?.("disconnected");
  }

  private open() {
    this.statusListener?.("connecting");
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.statusListener?.("live");
      this.startHeartbeat();
    };

    this.ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data as string) as WebSocketEvent;
        this.listener?.(data);
      } catch {
        // Ignore malformed websocket messages.
      }
    };

    this.ws.onclose = () => {
      this.statusListener?.("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    const backoff = Math.min(30_000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => this.open(), backoff);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send("ping");
    }, 15_000);
  }
}

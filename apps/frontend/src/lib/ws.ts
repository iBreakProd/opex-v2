export type QuotePayload = Record<
  string,
  { ask_price: number; bid_price: number; decimal: number }
>;

type Listener = (data: QuotePayload) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private url =
    (import.meta.env.VITE_WS_URL as string) || "ws://localhost:8080";
  private listeners = new Set<Listener>();
  private retryMs = 1000;

  connect() {
    if (this.ws) return;
    this.open();
    document.addEventListener("visibilitychange", this.onVisChange);
  }

  private open() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      if (import.meta.env.DEV) console.log("[ws] open", this.url);
      this.retryMs = 1000;
    };
    this.ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as QuotePayload;
        this.listeners.forEach((l) => l(data));
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[ws] Invalid message", err);
        }
      }
    };
    this.ws.onclose = () => {
      if (import.meta.env.DEV) console.log("[ws] close");
      this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      if (import.meta.env.DEV) console.log("[ws] error");
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    this.ws = null;
    setTimeout(() => this.open(), this.retryMs);
    this.retryMs = Math.min(this.retryMs * 2, 15000);
  }

  private onVisChange = () => {
    if (document.visibilityState === "visible" && !this.ws) {
      this.open();
    }
  };

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const wsClient = new WSClient();

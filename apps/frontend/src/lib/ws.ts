export type QuotePayload = Record<
  string,
  { ask_price: number; bid_price: number; decimal: number }
>;

type QuoteListener = (data: QuotePayload) => void;
type UserStateListener = () => void;

class WSClient {
  private ws: WebSocket | null = null;
  private url =
    (import.meta.env.VITE_WS_URL as string) || "ws://localhost:8080";
  private listeners = new Set<QuoteListener>();
  private userStateListeners = new Set<UserStateListener>();
  private retryMs = 1000;
  private currentUserId: string | null = null;
  private isConnecting = false;
  private isVisibilityListenerAdded = false;
  private instanceId = Math.random().toString(36).substring(7);

  constructor() {
    if (import.meta.env.DEV) console.log(`\n\n[ws] WSClient initialized. ID: ${this.instanceId}`);
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      if (import.meta.env.DEV) console.log(`\n\n[ws] [${this.instanceId}] Connection already active or in progress`);
      return;
    }
    
    if (import.meta.env.DEV) console.log(`\n\n[ws] [${this.instanceId}] Connect called`);
    this.open();
    if (!this.isVisibilityListenerAdded) {
        document.addEventListener("visibilitychange", this.onVisChange);
        this.isVisibilityListenerAdded = true;
    }
  }

  identify(userId: string) {
    this.currentUserId = userId;
    this.sendIdentity();
  }

  private sendIdentity() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.currentUserId) return;
    try {
      this.ws.send(JSON.stringify({ type: "identity", userId: this.currentUserId }));
      if (import.meta.env.DEV) console.log(`\n\n[ws] Identified as ${this.currentUserId}`);
    } catch {
      // ignore
    }
  }

  private open() {
    this.isConnecting = true;
    if (import.meta.env.DEV) console.log("\n\n[ws] Opening connection to", this.url);
    
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      this.isConnecting = false;
      if (import.meta.env.DEV) console.log("\n\n[ws] Connected");
      this.retryMs = 1000;
      this.sendIdentity();
    };

    this.ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as { type?: string } & QuotePayload;
        if (data.type === "userStateChanged") {
          this.userStateListeners.forEach((l) => l());
          return;
        }
        this.listeners.forEach((l) => l(data as QuotePayload));
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("\n\n[ws] Invalid message", err);
        }
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.ws = null;
      if (import.meta.env.DEV) console.log("\n\n[ws] Closed. Reconnecting in", this.retryMs, "ms");
      setTimeout(() => {
        if (document.hidden) return;
        this.open();
      }, this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, 30000); // Exponential backoff
    };

    this.ws.onerror = (err) => {
        this.isConnecting = false;
        if (import.meta.env.DEV) console.error("\n\n[ws] Error", err);
    };
  }

  private onVisChange = () => {
    if (document.hidden) return;
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  };

  subscribe(listener: QuoteListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeUserState(listener: UserStateListener) {
    this.userStateListeners.add(listener);
    return () => {
      this.userStateListeners.delete(listener);
    };
  }
}

export const wsClient = new WSClient();

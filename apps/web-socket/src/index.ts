import { WebSocket, WebSocketServer } from "ws";
import { subscriber } from "@repo/redis/pubsub";
import "dotenv/config";

process.on("unhandledRejection", (reason) => {
  console.error("\n\n[WebSocket] Unhandled rejection", reason);
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  console.error("\n\n[WebSocket] Uncaught exception", err);
  process.exitCode = 1;
  process.exit(1);
});

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`\n\n[WebSocket] Missing required environment variable: ${name}`);
  }
  return value;
}

const WS_PORT = Number(getRequiredEnv("WS_PORT"));
if (Number.isNaN(WS_PORT) || WS_PORT <= 0) {
  throw new Error("\n\n[WebSocket] WS_PORT must be a positive number");
}

const SHUTDOWN_TIMEOUT_MS = 5_000;

const wss = new WebSocketServer({ port: WS_PORT });

const connectionToUserId = new Map<WebSocket, string>();
const userIdToConnections = new Map<string, Set<WebSocket>>();

function registerIdentity(ws: WebSocket, userId: string): void {
  const prev = connectionToUserId.get(ws);
  if (prev) {
    userIdToConnections.get(prev)?.delete(ws);
  }
  connectionToUserId.set(ws, userId);
  let set = userIdToConnections.get(userId);
  if (!set) {
    set = new Set();
    userIdToConnections.set(userId, set);
  }
  set.add(ws);
}

function unregisterConnection(ws: WebSocket): void {
  const userId = connectionToUserId.get(ws);
  if (userId) {
      connectionToUserId.delete(ws);
      const set = userIdToConnections.get(userId);
      if (set) {
          set.delete(ws);
          if (set.size === 0) {
              userIdToConnections.delete(userId);
          }
      }
  } else {
      // console.log("\n\n[WebSocket] Unregistering Anonymous Connection"); 
  }
}

async function gracefulShutdown(): Promise<void> {
  const forceExit = setTimeout(() => {
    console.error("\n\n[WebSocket] Shutdown Timeout - Force Exiting");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  await new Promise<void>((resolve) => {
    wss.close(() => {
        resolve();
    });
  });

  try {
    await subscriber.quit();
  } catch (err) {
    console.error("\n\n[WebSocket] Redis close error", err);
  }

  clearInterval(pingInterval);
  clearTimeout(forceExit);
  process.exit(0);
}

process.on("SIGTERM", () => {
  void gracefulShutdown();
});
process.on("SIGINT", () => {
  void gracefulShutdown();
});

(async () => {
  try {
    await subscriber.connect();
  } catch (err) {
    console.error("\n\n[WebSocket] Redis Connect Error", err);
    process.exitCode = 1;
    process.exit(1);
  }

  await subscriber.subscribe("ws:price:update", (msg) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch (err) {
          console.error("\n\n[WebSocket] Failed to send price update to client", err);
        }
      }
    });
  });

  const USER_STATE_CHANNEL_PREFIX = "ws:user:state:";
  await subscriber.pSubscribe("ws:user:state:*", (message, channel) => {
    if (typeof channel !== "string" || !channel.startsWith(USER_STATE_CHANNEL_PREFIX)) return;
    const userId = channel.slice(USER_STATE_CHANNEL_PREFIX.length);
    
    const connections = userIdToConnections.get(userId);
    if (!connections) {
        return;
    }
    
    connections.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (err) {
          console.error("\n\n[WebSocket] Failed to send user state to client", err);
        }
      }
    });
  });
})();

const pingInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    const ws = client as WebSocket & { isAlive?: boolean };
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(pingInterval);
});

wss.on("connection", (ws) => {
  const customWs = ws as WebSocket & { isAlive?: boolean };
  customWs.isAlive = true;

  ws.on("pong", () => {
    customWs.isAlive = true;
  });

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString()) as { type?: string; userId?: string };
      if (data.type === "identity" && typeof data.userId === "string") {
        registerIdentity(ws, data.userId);
      }
    } catch {
    }
  });
  ws.on("close", () => unregisterConnection(ws));
  ws.on("error", (err) => console.error("\n\n[WebSocket] Connection Error", err));
});

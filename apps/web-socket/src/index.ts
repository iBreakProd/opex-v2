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
  console.log(`\n\n[WebSocket] Registering Identity: ${userId}`);
  const prev = connectionToUserId.get(ws);
  if (prev) {
    console.log(`\n\n[WebSocket] Removing previous identity: ${prev}`);
    userIdToConnections.get(prev)?.delete(ws);
  }
  connectionToUserId.set(ws, userId);
  let set = userIdToConnections.get(userId);
  if (!set) {
    set = new Set();
    userIdToConnections.set(userId, set);
  }
  set.add(ws);
  console.log(`\n\n[WebSocket] Identity registered. User: ${userId} has ${set.size} connections.`);
}

function unregisterConnection(ws: WebSocket): void {
  const userId = connectionToUserId.get(ws);
  if (userId) {
      console.log(`\n\n[WebSocket] Unregistering Connection for User: ${userId}`);
      connectionToUserId.delete(ws);
      const set = userIdToConnections.get(userId);
      if (set) {
          set.delete(ws);
          if (set.size === 0) {
              userIdToConnections.delete(userId);
              console.log(`\n\n[WebSocket] User ${userId} has no more active connections.`);
          }
      }
  } else {
      // console.log("\n\n[WebSocket] Unregistering Anonymous Connection"); 
  }
}

async function gracefulShutdown(): Promise<void> {
  console.log("\n\n[WebSocket] Initiating Graceful Shutdown...");
  const forceExit = setTimeout(() => {
    console.error("\n\n[WebSocket] Shutdown Timeout - Force Exiting");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  await new Promise<void>((resolve) => {
    wss.close(() => {
        console.log("\n\n[WebSocket] Server Closed.");
        resolve();
    });
  });

  try {
    await subscriber.quit();
    console.log("\n\n[WebSocket] Redis Subscriber Closed.");
  } catch (err) {
    console.error("\n\n[WebSocket] Redis close error", err);
  }

  clearTimeout(forceExit);
  console.log("\n\n[WebSocket] Shutdown Complete.");
  process.exit(0);
}

process.on("SIGTERM", () => {
  void gracefulShutdown();
});
process.on("SIGINT", () => {
  void gracefulShutdown();
});

(async () => {
  console.log(`\n\n[WebSocket] Starting WebSocket Server on port ${WS_PORT}...`);
  try {
    await subscriber.connect();
    console.log("\n\n[WebSocket] Redis Subscriber Connected.");
  } catch (err) {
    console.error("\n\n[WebSocket] Redis Connect Error", err);
    process.exitCode = 1;
    process.exit(1);
  }

  await subscriber.subscribe("ws:price:update", (msg) => {
    // console.log(`\n\n[WebSocket] Broadcasting Price Update to ${wss.clients.size} clients.`); // noisy
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
    console.log(`\n\n[WebSocket] Received User State Update for: ${userId}`);
    
    const connections = userIdToConnections.get(userId);
    if (!connections) {
        console.log(`\n\n[WebSocket] No active connections for user: ${userId}. Skipping broadcast.`);
        return;
    }
    
    console.log(`\n\n[WebSocket] Broadcasting User State to ${connections.size} connections for user: ${userId}`);
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

wss.on("connection", (ws) => {
  console.log("\n\n[WebSocket] New Connection");
  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString()) as { type?: string; userId?: string };
      if (data.type === "identity" && typeof data.userId === "string") {
        registerIdentity(ws, data.userId);
      }
    } catch {
       console.warn("\n\n[WebSocket] Received Invalid/Non-JSON Message");
    }
  });
  ws.on("close", () => unregisterConnection(ws));
  ws.on("error", (err) => console.error("\n\n[WebSocket] Connection Error", err));
});

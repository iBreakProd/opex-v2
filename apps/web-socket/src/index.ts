import { WebSocket, WebSocketServer } from "ws";
import { subscriber } from "@repo/redis/pubsub";
import "dotenv/config";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection", reason);
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception", err);
  process.exitCode = 1;
  process.exit(1);
});

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const WS_PORT = Number(getRequiredEnv("WS_PORT"));
if (Number.isNaN(WS_PORT) || WS_PORT <= 0) {
  throw new Error("WS_PORT must be a positive number");
}

const SHUTDOWN_TIMEOUT_MS = 5_000;

const wss = new WebSocketServer({ port: WS_PORT });

async function gracefulShutdown(): Promise<void> {
  const forceExit = setTimeout(() => {
    console.error("Web-socket shutdown timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  await new Promise<void>((resolve) => {
    wss.close(() => resolve());
  });

  try {
    await subscriber.quit();
  } catch (err) {
    console.error("Web-socket Redis close error", err);
  }

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
  console.log("Start ws");
  try {
    await subscriber.connect();
  } catch (err) {
    console.error(err);
    console.error("Did not connect to redis");
    process.exitCode = 1;
    process.exit(1);
  }

  console.log("sub connected");

  await subscriber.subscribe("ws:price:update", (msg) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch (err) {
          console.error("Failed to send to client", err);
        }
      }
    });
  });
})();

wss.on("connection", () => {
  console.log("Connected to ws");
});

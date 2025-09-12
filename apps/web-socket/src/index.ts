import { WebSocket, WebSocketServer } from "ws";
import { subscriber } from "@repo/redis/pubsub";
import "dotenv/config";

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

const wss = new WebSocketServer({ port: WS_PORT });

(async () => {
  console.log("Start ws");
  try {
    await subscriber.connect();
  } catch (err) {
    console.error(err);
    console.error("Did not connect to redis");
    process.exitCode = 1;
    return;
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

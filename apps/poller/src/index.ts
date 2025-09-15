import { WebSocket } from "ws";
import "dotenv/config";
import { publisher } from "@repo/redis/pubsub";
import { priceUpdatePusher } from "@repo/redis/queue";
import { BackpackDataType, FilteredDataType } from "@repo/types/types";

process.on("unhandledRejection", (reason) => {
  console.error("\n\n[Poller] Unhandled rejection", reason);
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  console.error("\n\n[Poller] Uncaught exception", err);
  process.exitCode = 1;
  process.exit(1);
});

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`\n\n[Poller] Missing required environment variable: ${name}`);
  }
  return value;
}

const BACKPACK_URL = getRequiredEnv("BACKPACK_URL");
const SHUTDOWN_TIMEOUT_MS = 3_000;

let lastInsertTime = Date.now();
let currentBackpackWs: WebSocket | null = null;
let running = true;
let assetPrices: Record<string, FilteredDataType> = {
  ETH_USDC_PERP: { ask_price: 0, bid_price: 0, decimal: 0 },
  SOL_USDC_PERP: { ask_price: 0, bid_price: 0, decimal: 0 },
  BTC_USDC_PERP: { ask_price: 0, bid_price: 0, decimal: 0 },
};

function safePriceFromStr(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const str = n.toFixed(4);
  const parts = str.split(".");
  const frac = parts[1] ?? "0000";
  const intPart = parts[0] ?? "0";
  const combined = intPart + frac.slice(0, 4);
  const result = Number.parseInt(combined, 10);
  return Number.isNaN(result) ? 0 : result;
}

function runPoller(): void {
  if (!running) return;
  console.log(`\n\n[Poller] Connecting to ${BACKPACK_URL}...`);
  const ws = new WebSocket(BACKPACK_URL);
  currentBackpackWs = ws;

  ws.onopen = () => {
    console.log("\n\n[Poller] Connected to Backpack WebSocket");
    const payload = JSON.stringify({
        method: "SUBSCRIBE",
        params: [
          "bookTicker.BTC_USDC_PERP",
          "bookTicker.ETH_USDC_PERP",
          "bookTicker.SOL_USDC_PERP",
        ],
        id: 1,
      });
    ws.send(payload);
    console.log("\n\n[Poller] Subscribed to Backpack tickers:", payload);
  };

  ws.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data.toString()) as { data?: unknown };
      const data = parsed?.data;
      if (!data || typeof data !== "object" || !("a" in data) || !("b" in data) || !("s" in data)) {
        // console.debug("[Poller] Received non-ticker message:", msg.data.toString().slice(0, 100)); // Debug log for non-ticker
        return;
      }
      const d = data as BackpackDataType;

      const ask_price = safePriceFromStr(d.a);
      const bid_price = safePriceFromStr(d.b);

      const filteredData: FilteredDataType = {
        ask_price,
        bid_price,
        decimal: 4,
      };

      const symbol = String(d.s);
      if (symbol) {
        assetPrices[symbol] = filteredData;
      }
      
      const timeDiff = Date.now() - lastInsertTime;
      if (timeDiff > 100) {
        const dataToBeSent: Record<string, FilteredDataType> = {};
        let updateCount = 0;
        for (const [key, value] of Object.entries(assetPrices)) {
          if (value.ask_price !== 0) {
            dataToBeSent[key] = value;
            updateCount++;
          }
        }
        
        if (updateCount > 0) {
            // console.log(`\n\n[Poller] Publishing price update for ${updateCount} assets. Time since last: ${timeDiff}ms`);
            publisher.publish("ws:price:update", JSON.stringify(dataToBeSent));
            priceUpdatePusher.xAdd("stream:app:info", "*", {
                reqId: "no-return",
                type: "price-update",
                tradePrices: JSON.stringify(dataToBeSent),
            });
            lastInsertTime = Date.now();
        }
      }
    } catch (err) {
      console.error("\n\n[Poller] Message processing error", err);
    }
  };

  ws.onerror = (err) => {
    console.error("\n\n[Poller] Backpack WebSocket Error", err);
  };

  ws.onclose = () => {
    currentBackpackWs = null;
    if (running) {
      console.log("\n\n[Poller] Backpack WebSocket Closed. Reconnecting in 5s...");
      setTimeout(() => runPoller(), 5000);
    } else {
        console.log("\n\n[Poller] Backpack WebSocket Closed (Shutdown).");
    }
  };
}

async function gracefulShutdown(): Promise<void> {
  console.log("\n\n[Poller] Initiating Graceful Shutdown...");
  running = false;
  if (currentBackpackWs) {
    currentBackpackWs.close();
    currentBackpackWs = null;
  }
  const forceExit = setTimeout(() => {
    console.error("\n\n[Poller] Shutdown Timeout - Force Exiting");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  try {
    await Promise.all([publisher.quit(), priceUpdatePusher.quit()]);
    console.log("\n\n[Poller] Redis connections closed.");
  } catch (err) {
    console.error("\n\n[Poller] Redis close error during shutdown", err);
  }
  clearTimeout(forceExit);
  console.log("\n\n[Poller] Shutdown Complete.");
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
    console.log("\n\n[Poller] Starting Poller Service...");
    await publisher.connect();
    await priceUpdatePusher.connect();
    console.log("\n\n[Poller] Redis Publisher & Pusher Connected.");
    runPoller();
  } catch (err) {
    console.error("\n\n[Poller] Startup Failed (Redis Connect Error)", err);
    process.exitCode = 1;
    process.exit(1);
  }
})();

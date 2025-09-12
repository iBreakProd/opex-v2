import { WebSocket } from "ws";
import "dotenv/config";
import { publisher } from "@repo/redis/pubsub";
import { priceUpdatePusher } from "@repo/redis/queue";
import { BackpackDataType, FilteredDataType } from "@repo/types/types";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const BACKPACK_URL = getRequiredEnv("BACKPACK_URL");

let lastInsertTime = Date.now();
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
  const ws = new WebSocket(BACKPACK_URL);

  ws.onopen = () => {
    console.log("Connected to the backpack WebSocket");
    ws.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: [
          "bookTicker.BTC_USDC_PERP",
          "bookTicker.ETH_USDC_PERP",
          "bookTicker.SOL_USDC_PERP",
        ],
        id: 1,
      })
    );
    console.log("Subscribed to Backpack");
  };

  ws.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data.toString()) as { data?: unknown };
      const data = parsed?.data;
      if (!data || typeof data !== "object" || !("a" in data) || !("b" in data) || !("s" in data)) {
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

      if (Date.now() - lastInsertTime > 100) {
        const dataToBeSent: Record<string, FilteredDataType> = {};
        for (const [key, value] of Object.entries(assetPrices)) {
          if (value.ask_price !== 0) {
            dataToBeSent[key] = value;
          }
        }
        publisher.publish("ws:price:update", JSON.stringify(dataToBeSent));
        priceUpdatePusher.xAdd("stream:app:info", "*", {
          reqId: "no-return",
          type: "price-update",
          tradePrices: JSON.stringify(dataToBeSent),
        });
        lastInsertTime = Date.now();
      }
    } catch (err) {
      console.error("Poller message error", err);
    }
  };

  ws.onerror = (err) => {
    console.error("Backpack WebSocket error", err);
  };

  ws.onclose = () => {
    console.log("Backpack WebSocket closed, reconnecting in 5s");
    setTimeout(() => runPoller(), 5000);
  };
}

(async () => {
  await publisher.connect();
  await priceUpdatePusher.connect();
  runPoller();
})();

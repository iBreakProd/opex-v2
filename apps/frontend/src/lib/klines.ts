import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const KLINES_BASE =
  (import.meta.env as unknown as { VITE_BINANCE_KLINES_API_URL?: string })
    .VITE_BINANCE_KLINES_API_URL || "https://fapi.binance.com/fapi/v1/klines";

export type Interval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type Kline = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export function mapToBinanceSymbol(symbol: string): string {
  if (symbol.endsWith("USDC")) return symbol.replace("USDC", "USDT");
  return symbol;
}

export function intervalToSeconds(interval: Interval): number {
  switch (interval) {
    case "1m":
      return 60;
    case "5m":
      return 5 * 60;
    case "15m":
      return 15 * 60;
    case "1h":
      return 60 * 60;
    case "4h":
      return 4 * 60 * 60;
    case "1d":
      return 24 * 60 * 60;
  }
}

export function useKlines(symbol: string, interval: Interval, limit = 100) {
  return useQuery({
    queryKey: ["klines", symbol, interval, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("symbol", symbol);
      params.set("interval", interval);
      if (limit) params.set("limit", String(limit));
      const url = `${KLINES_BASE}?${params.toString()}`;
      if (import.meta.env.DEV) {
        console.log("\n\n[klines] request", { url });
      }
      const { data } = await axios.get(url, { withCredentials: false });
      const out = (data as unknown as unknown[][]).map((d) => ({
        time: Math.floor(Number(d[0]) / 1000),
        open: Number(d[1]),
        high: Number(d[2]),
        low: Number(d[3]),
        close: Number(d[4]),
      })) as Kline[];
      if (import.meta.env.DEV) {
        console.log("\n\n[klines] response count", out.length);
        console.log("\n\n[klines] first/last", out[0], out[out.length - 1]);
      }
      return out;
    },
    staleTime: 60_000,
    enabled: Boolean(symbol && interval),
  });
}

export async function fetchKlinesBefore(
  symbol: string,
  interval: Interval,
  endTimeSec: number,
  limit = 100
) {
  const params = new URLSearchParams();
  params.set("symbol", symbol);
  params.set("interval", interval);
  params.set("limit", String(limit));
  if (endTimeSec) params.set("endTime", String(endTimeSec * 1000));
  const url = `${KLINES_BASE}?${params.toString()}`;
  if (import.meta.env.DEV) console.log("\n\n[klines.before]", { url });
  const { data } = await axios.get(url, { withCredentials: false });
  const out = (data as unknown as unknown[][]).map((d) => ({
    time: Math.floor(Number(d[0]) / 1000),
    open: Number(d[1]),
    high: Number(d[2]),
    low: Number(d[3]),
    close: Number(d[4]),
  })) as Kline[];
  return out;
}

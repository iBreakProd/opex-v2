import { create } from "zustand";
import { useEffect } from "react";
import { wsClient } from "@/lib/ws";
import { wsToAppSymbol } from "@/lib/symbols";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "1d";

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

type CandlesState = {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  candlesBySymbol: Record<string, Record<Timeframe, Candle[]>>;
  maxBars: number;
};

export const useCandlesStore = create<CandlesState>((set) => ({
  timeframe: "1m",
  setTimeframe: (tf) => set({ timeframe: tf }),
  candlesBySymbol: {},
  maxBars: 180,
}));

function floorTime(ts: number, ms: number) {
  return Math.floor(ts / ms) * ms;
}

let wsStarted = false;
export function useCandlesFeed() {
  useEffect(() => {
    if (!wsStarted) {
      wsClient.connect();
      wsStarted = true;
    }
    const unsubscribe = wsClient.subscribe((data) => {
      const now = Date.now();
      const buckets: Record<Timeframe, number> = {
        "1m": floorTime(now, 60_000),
        "5m": floorTime(now, 300_000),
        "15m": floorTime(now, 900_000),
        "1h": floorTime(now, 3_600_000),
        "1d": floorTime(now, 86_400_000),
      };

      useCandlesStore.setState((state) => {
        const next = {
          ...state.candlesBySymbol,
        } as CandlesState["candlesBySymbol"];
        const maxBars = state.maxBars;

        for (const [rawSymbol, v] of Object.entries(data)) {
          const symbol = wsToAppSymbol(rawSymbol);
          const mid = (v.ask_price + v.bid_price) / 2 / Math.pow(10, v.decimal);

          if (!next[symbol])
            next[symbol] = {
              "1m": [],
              "5m": [],
              "15m": [],
              "1h": [],
              "1d": [],
            };

          (Object.keys(buckets) as Timeframe[]).forEach((tf) => {
            const bucket = buckets[tf];
            const arr = next[symbol][tf];
            const last = arr[arr.length - 1];
            if (!last || last.t !== bucket) {
              arr.push({ t: bucket, o: mid, h: mid, l: mid, c: mid });
              if (arr.length > maxBars) arr.splice(0, arr.length - maxBars);
            } else {
              last.c = mid;
              if (mid > last.h) last.h = mid;
              if (mid < last.l) last.l = mid;
            }
          });
        }

        return { candlesBySymbol: next };
      });
    });
    return () => {
      unsubscribe();
    };
  }, []);
}

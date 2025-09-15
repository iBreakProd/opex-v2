import { create } from "zustand";
import { useEffect } from "react";
import { wsClient } from "@/lib/ws";
import { wsToAppSymbol } from "@/lib/symbols";
import type { QuotePayload } from "@/lib/ws";

type QuotesState = {
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  quotes: QuotePayload;
};

export const useQuotesStore = create<QuotesState>((set) => ({
  selectedSymbol: "BTCUSDC",
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),
  quotes: {},
}));

export function useQuotesFeed() {
  useEffect(() => {
    wsClient.connect();
    const unsubscribe = wsClient.subscribe((data) => {
      const mapped: QuotePayload = {};
      for (const [k, v] of Object.entries(data)) {
        mapped[wsToAppSymbol(k)] = v as typeof data[string];
      }
      const prev = useQuotesStore.getState().quotes;
      let changed = false;
      const prevKeys = Object.keys(prev);
      const mappedKeys = Object.keys(mapped);
      if (prevKeys.length !== mappedKeys.length) {
        changed = true;
      } else {
        for (const key of mappedKeys) {
          const a = prev[key];
          const b = mapped[key];
          if (
            !a ||
            a.ask_price !== b.ask_price ||
            a.bid_price !== b.bid_price ||
            a.decimal !== b.decimal
          ) {
            changed = true;
            break;
          }
        }
      }
      if (changed) {
        useQuotesStore.setState({ quotes: mapped });
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
}

export function formatPrice(intPrice: number, decimal: number) {
  const str = String(intPrice).padStart(decimal + 1, "0");
  const whole = str.slice(0, str.length - decimal);
  const frac = str.slice(str.length - decimal);
  return `${whole}.${frac}`;
}

export function getMidPrice(quote: { ask_price: number; bid_price: number; decimal: number }) {
  return (quote.ask_price + quote.bid_price) / 2 / Math.pow(10, quote.decimal);
}

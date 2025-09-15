import { useEffect, useRef } from "react";
import { useCandlesStore, useCandlesFeed } from "@/lib/candlesStore";
import type { Timeframe, Candle } from "@/lib/candlesStore";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type BusinessDay,
  type Time,
  type CandlestickData,
  type WhitespaceData,
} from "lightweight-charts";
import { useKlines, fetchKlinesBefore } from "@/lib/klines";
import { useQuotesStore, getMidPrice } from "@/lib/quotesStore";

type SeriesPoint = CandlestickData<Time> | WhitespaceData<Time>;

type CandlestickSeriesApi = ISeriesApi<"Candlestick"> & {
  dataByIndex?(index: number): SeriesPoint | null | undefined;
  data?(): readonly SeriesPoint[];
};

function isCandlestickPoint(
  point: SeriesPoint
): point is CandlestickData<Time> {
  return (point as CandlestickData<Time>).open !== undefined;
}

type Props = {
  symbol: string;
  decimal?: number;
};

export default function CandlesChart({ symbol, decimal = 2 }: Props) {
  useCandlesFeed();
  const timeframe = useCandlesStore((s) => s.timeframe);
  const selected = useCandlesStore((s) => {
    const by = s.candlesBySymbol[symbol];
    return by ? by[timeframe] : undefined;
  });
  const EMPTY: ReadonlyArray<Candle> = [] as const;
  const candles = (selected ?? EMPTY) as Candle[];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<CandlestickSeriesApi | null>(null);

  useEffect(() => {
    if (seriesRef.current && decimal) {
      seriesRef.current.applyOptions({
        priceFormat: {
          type: "price",
          precision: decimal,
          minMove: 1 / Math.pow(10, decimal),
        },
      });
    }
  }, [decimal]);


  function getLayout() {
    return {
      textColor: "#171707", 
      background: { color: "#F3EFDE00" }, 
    } as const;
  }

  function toUnixSec(t: Time): number {
    if (typeof t === "number") return t;
    if (typeof t === "string") return Math.floor(new Date(t).getTime() / 1000);
    const d = t as BusinessDay;
    if (d && typeof d.year === "number") {
      return Math.floor(Date.UTC(d.year, d.month - 1, d.day) / 1000);
    }
    return 0;
  }

  const seedInterval = timeframe;
  const { data: klines } = useKlines(symbol, seedInterval, 100);

  useEffect(() => {
    if (!containerRef.current) return;
    const initialHeight = containerRef.current.clientHeight || 320;
    const chart = createChart(containerRef.current, {
      layout: getLayout(),
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 6,
        rightOffset: 10,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      height: initialHeight,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#C1C10B",
      downColor: "#E73D27",
      borderVisible: false,
      wickUpColor: "#C1C10B",
      wickDownColor: "#E73D27",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    });
    ro.observe(containerRef.current);

    const onThemeChange = () => {
      chart.applyOptions({ layout: getLayout() });
    };
    window.addEventListener("themechange", onThemeChange);

    return () => {
      window.removeEventListener("themechange", onThemeChange);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!seriesRef.current || !klines?.length) return;
    const last100 = klines.slice(-100);
    seriesRef.current.setData(
      last100.map((k) => ({
        time: k.time as UTCTimestamp,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }))
    );
     // Force scroll to the latest bar
     chartRef.current?.timeScale().scrollToPosition(0, false);
  }, [klines]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    const chart = chartRef.current;
    let loading = false;

    const handler = async () => {
      if (loading) return;
      const range = chart.timeScale().getVisibleRange();
      const logical = chart.timeScale().getVisibleLogicalRange();
      if (!range || !logical) return;
      if (logical.from < 5) {
        loading = true;
        const first =
          seriesRef.current?.dataByIndex?.(0) ??
          seriesRef.current?.data?.()[0];
        const baseTime: Time = (first?.time ?? range.from) as Time;
        const firstTimeSec = toUnixSec(baseTime);
        const endTimeSec = Math.max(0, firstTimeSec - 1);
        try {
          const older = await fetchKlinesBefore(
            symbol,
            seedInterval,
            endTimeSec,
            100
          );
          if (older && older.length) {
            const mapped = older.map((k) => ({
              time: k.time as UTCTimestamp,
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
            }));
            const current =
              seriesRef.current?.data?.().filter(isCandlestickPoint) ?? [];
            const byTime = new Map<number, CandlestickData<Time>>();
            for (const p of [...mapped, ...current]) {
              const t =
                typeof p.time === "number"
                  ? (p.time as number)
                  : 0;
              byTime.set(t, p as CandlestickData<Time>);
            }
            const deduped = Array.from(byTime.entries())
              .sort(([t1], [t2]) => t1 - t2)
              .map(([, p]) => p);
            seriesRef.current!.setData(deduped);
          }
        } finally {
          loading = false;
        }
      }
    };

    chart.timeScale().subscribeVisibleTimeRangeChange(handler);
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handler);
    };
  }, [symbol, seedInterval]);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    const last = candles[candles.length - 1]!;
    seriesRef.current.update({
      time: Math.floor(last.t / 1000) as UTCTimestamp,
      open: last.o,
      high: last.h,
      low: last.l,
      close: last.c,
    });
  }, [candles]);

  const live = useQuotesStore((s) => s.quotes[symbol]);
  useEffect(() => {
    if (!seriesRef.current || !live) return;
    const price = getMidPrice(live);
    const nowMs = Date.now();
    const bucketMs = (() => {
      switch (timeframe) {
        case "1m":
          return Math.floor(nowMs / 60_000) * 60_000;
        case "5m":
          return Math.floor(nowMs / 300_000) * 300_000;
        case "15m":
          return Math.floor(nowMs / 900_000) * 900_000;
        case "1h":
          return Math.floor(nowMs / 3_600_000) * 3_600_000;
        case "1d":
          return Math.floor(nowMs / 86_400_000) * 86_400_000;
      }
    })();
    const last = candles[candles.length - 1];
    if (last && last.t === bucketMs) {
      const nextBar = {
        time: Math.floor(bucketMs / 1000) as UTCTimestamp,
        open: last.o,
        high: Math.max(last.h, price),
        low: Math.min(last.l, price),
        close: price,
      };
      seriesRef.current.update(nextBar);
    } else if (bucketMs) {
      seriesRef.current.update({
        time: Math.floor(bucketMs / 1000) as UTCTimestamp,
        open: price,
        high: price,
        low: price,
        close: price,
      });
    }
  }, [live, timeframe, candles, symbol]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
       {/* UTC Label */}
       <div className="absolute bottom-[10px] left-2 text-[10px] text-text-main/40 font-bold z-10 pointer-events-none font-mono-retro">
          UTC
       </div>
    </div>
  );
}

export function TimeframeSwitcher() {
  const timeframe = useCandlesStore((s) => s.timeframe);
  const setTimeframe = useCandlesStore((s) => s.setTimeframe);
  const tfs: Timeframe[] = ["1m", "5m", "15m", "1h", "1d"];
  
  return (
    <div className="flex items-center gap-0.5 bg-white/80 backdrop-blur-sm p-0.5 rounded-md border border-text-main/10 shadow-sm scale-90 origin-center">
      {tfs.map((tf) => (
        <button
          key={tf}
          onClick={() => setTimeframe(tf)}
          className={`
            !px-3.5 !py-0.5 !rounded-sm text-[9px] font-bold font-mono-retro transition-all border uppercase
            ${timeframe === tf
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-transparent text-text-main/60 border-transparent hover:bg-black/5 hover:text-text-main"
            }
          `}
        >
          {tf.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

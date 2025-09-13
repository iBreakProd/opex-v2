import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useSessionProbe } from "@/lib/session";
import { useQuotesFeed, useQuotesStore, formatPrice } from "@/lib/quotesStore";
import CandlesChart, { TimeframeSwitcher } from "@/components/CandlesChart";
import QuotesTable from "@/components/QuotesTable";
import TradeForm from "@/components/TradeForm";
import OpenOrders from "@/components/OpenOrders";
import { useUsdBalance } from "@/lib/balance";
import { useOpenOrdersStore } from "@/lib/openOrdersStore";
import { backendToAppSymbol } from "@/lib/symbols";
import { toDecimalNumber } from "@/lib/utils";

export default function Trade() {
  useSessionProbe();
  useQuotesFeed();
  const { quotes, selectedSymbol, setSelectedSymbol } = useQuotesStore();
  const q = quotes[selectedSymbol];
  const [showLeft, setShowLeft] = useState(true);
  const [leftWidth, setLeftWidth] = useState(25);
  const rightWidth = 25;
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [isResizingLeft, setIsResizingLeft] = useState(false);

  const [chartRatio, setChartRatio] = useState(0.6);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isResizingChart, setIsResizingChart] = useState(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (isResizingLeft && mainRef.current) {
        const rect = mainRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const total = rect.width;
        const next = Math.max(15, Math.min(40, (x / total) * 100));
        setLeftWidth(next);
      }
      if (isResizingChart && contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const total = rect.height;
        const pos = Math.max(0, Math.min(1, y / total));
        const ratio = Math.max(0.1, Math.min(0.9, pos));
        setChartRatio(ratio);
      }
    }
    function onMouseUp() {
      setIsResizingLeft(false);
      setIsResizingChart(false);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizingLeft, isResizingChart]);

  const { data: usdBalance, isLoading: isBalanceLoading } = useUsdBalance();
  const openOrders = Object.values(useOpenOrdersStore((s) => s.ordersById));
  const equity = (() => {
    const base = usdBalance ? usdBalance.balance : 0;
    let pnl = 0;
    let margin = 0;
    for (const o of openOrders) {
      const appSym = backendToAppSymbol(o.asset);
      const lq = quotes[appSym];
      if (!lq) continue;
      const current = o.type === "long" ? lq.bid_price : lq.ask_price;
      pnl +=
        (o.type === "long" ? current - o.openPrice : o.openPrice - current) *
        o.quantity *
        o.leverage;
      margin += o.margin || 0;
    }
    return base + pnl + margin;
  })();
  return (
    <div className="h-screen w-screen overflow-hidden">
      <nav className="flex h-12 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeft((v) => !v)}
            aria-label={showLeft ? "Hide sidebar" : "Show sidebar"}
          >
            {showLeft ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
          <div className="font-bold">opex</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground">
            Available:{" "}
            {isBalanceLoading
              ? "Loading…"
              : toDecimalNumber(
                  usdBalance?.balance ?? 0,
                  usdBalance?.decimal ?? 4
                )}
          </span>
          <span className="text-xs font-semibold text-foreground">
            Equity:{" "}
            {isBalanceLoading
              ? "Loading…"
              : toDecimalNumber(equity, usdBalance?.decimal ?? 4)}
          </span>
          <ThemeToggle />
        </div>
      </nav>
      <main
        ref={mainRef}
        className="grid h-[calc(100vh-48px)] gap-2 p-2"
        style={{
          gridTemplateColumns: showLeft
            ? `${leftWidth}% 6px ${100 - rightWidth - leftWidth}% ${rightWidth}%`
            : `1fr ${rightWidth}%`,
        }}
      >
        {/* Left: Live Prices */}
        {showLeft ? (
          <aside className="rounded-lg border p-2">
            <h4 className="mb-1 mt-0 text-sm font-semibold">Live Prices</h4>
            <QuotesTable />
          </aside>
        ) : null}
        {showLeft ? (
          <div
            className="h-full w-1 cursor-col-resize justify-self-stretch bg-border"
            onMouseDown={() => setIsResizingLeft(true)}
          />
        ) : null}

        {/* Middle: Chart and Open Orders with horizontal resizer */}
        <section className="flex min-h-[70vh] flex-col gap-2 rounded-lg border p-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {["BTCUSDC", "ETHUSDC", "SOLUSDC"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSymbol(s)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                    s === selectedSymbol
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="text-[13px] text-foreground">
              {q ? (
                <>
                  Bid {formatPrice(q.bid_price, q.decimal)} · Ask{" "}
                  {formatPrice(q.ask_price, q.decimal)}
                </>
              ) : (
                <>Waiting for quotes…</>
              )}
            </div>
            <div className="ml-auto">
              <TimeframeSwitcher />
            </div>
          </div>
          <div ref={contentRef} className="flex min-h-0 flex-1 flex-col">
            <div
              style={{
                flex: `0 0 ${Math.round(chartRatio * 100)}%`,
                minHeight: 80,
              }}
            >
              <CandlesChart symbol={selectedSymbol} />
            </div>
            <div
              className="z-10 h-3 -my-1 cursor-row-resize bg-border/70 hover:bg-primary/50 active:bg-primary select-none"
              onMouseDown={() => setIsResizingChart(true)}
            />
            <div
              className="min-h-0 flex-1 overflow-auto border-t"
              style={{ minHeight: 80 }}
            >
              <OpenOrders />
            </div>
          </div>
        </section>

        {/* Right */}
        <aside className="rounded-lg border p-2 mr-8">
          <h4 className="mb-1 mt-0 text-sm font-semibold">Open Trade</h4>
          <TradeForm />
        </aside>
      </main>
    </div>
  );
}

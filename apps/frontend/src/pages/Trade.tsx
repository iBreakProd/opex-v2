import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionProbe, useSessionStore } from "@/lib/session";
import { useQuotesFeed, useQuotesStore, getMidPrice } from "@/lib/quotesStore";
import { wsClient } from "@/lib/ws";
import CandlesChart, { TimeframeSwitcher } from "@/components/CandlesChart";
import QuotesTable from "@/components/QuotesTable";
import TradeForm from "@/components/TradeForm";
import OpenOrders from "@/components/OpenOrders";
import { useUsdBalance } from "@/lib/balance";
import { useOpenOrdersStore } from "@/lib/openOrdersStore";
import { backendToAppSymbol } from "@/lib/symbols";
import { toDecimalNumber } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Grid3x3, LogOut } from "lucide-react";

export default function Trade() {
  useSessionProbe();
  useQuotesFeed();
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.userId);

  useEffect(() => {
    if (userId) wsClient.identify(userId);
  }, [userId]);

  useEffect(() => {
    const unsubscribe = wsClient.subscribeUserState(() => {
      queryClient.invalidateQueries({ queryKey: ["openOrders"] });
      queryClient.invalidateQueries({ queryKey: ["balance.usd"] });
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const { quotes, selectedSymbol } = useQuotesStore();
  const q = quotes[selectedSymbol];
  
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
        o.quantity;
      margin += o.margin || 0;
    }
    return base + pnl + margin;
  })();

  return (
    <div className="min-h-screen w-screen overflow-x-hidden lg:overflow-hidden bg-background-light text-text-main font-mono-retro flex flex-col">
      {/* Header */}
      <nav className="h-16 border-b-3 border-text-main flex items-center justify-between px-6 bg-background-light shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-text-main flex items-center justify-center shadow-brutal group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-brutal-hover transition-all">
              <Grid3x3 className="text-background-light w-5 h-5" />
            </div>
            <span className="font-serif-heading font-bold text-2xl tracking-tight italic">OPEX</span>
          </Link>
          <div className="h-6 w-0.5 bg-text-main/20 mx-2"></div>
          {/* Header Asset Selector Removed - Moved to Sidebar */}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Equity</span>
            <span className="text-lg font-bold font-mono-retro">
              ${isBalanceLoading
                ? "---"
                : toDecimalNumber(equity, usdBalance?.decimal ?? 4).toLocaleString()}
            </span>
          </div>
           <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Balance</span>
            <span className="text-sm font-bold font-mono-retro">
              ${isBalanceLoading
                ? "---"
                : toDecimalNumber(usdBalance?.balance ?? 0, usdBalance?.decimal ?? 4).toLocaleString()}
            </span>
          </div>
          <button className="p-2 hover:bg-red-100 text-chart-red transition-colors rounded-sm" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Grid/Flex Layout */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden min-h-0 bg-background-light">
        
        {/* Left Col: Quotes (Mobile: Top, Desktop: Left) */}
        <aside className="lg:col-span-2 border-b-3 lg:border-b-0 lg:border-r-3 border-text-main bg-white/30 flex flex-col shrink-0 lg:h-full order-1">
          <div className="p-3 border-b-2 border-text-main/10 bg-background-light flex justify-between items-center cursor-pointer lg:cursor-default group" onClick={() => {
              // Simple mobile toggle logic could go here, but for now we just show it
          }}>
            <h3 className="font-bold text-xs uppercase tracking-wider">Market Data</h3>
            <span className="lg:hidden text-[10px] text-text-main/60">// TAP_TO_EXPAND</span>
          </div>
          <div className="max-h-[200px] lg:max-h-none overflow-y-auto lg:flex-1 p-0">
             <QuotesTable />
          </div>
        </aside>

        {/* Center Col: Chart & Orders (Mobile: Middle, Desktop: Center) */}
        <section className="lg:col-span-7 flex flex-col shrink-0 lg:h-full relative order-2 lg:overflow-hidden border-b-3 lg:border-b-0 border-text-main">
          {/* Chart Header Overlay could go here */}
          <div className="h-[400px] lg:h-[60%] border-b-3 border-text-main relative bg-white/50 shrink-0 flex flex-col">
             {/* Chart Header Bar */}
             <div className="h-14 border-b border-text-main/10 flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm shrink-0 z-20">
                {/* Left: Symbol Info */}
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl lg:text-2xl font-serif-heading font-black leading-none">{selectedSymbol}</span>
                        {q && (
                            <span className="text-xs px-1.5 py-0.5 bg-text-main text-background-light font-bold leading-none self-center">
                                LIVE
                            </span>
                        )}
                    </div>
                </div>

                {/* Center: Timeframe Switcher - Absolute Centered to ensure it's exactly in the middle */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                   <TimeframeSwitcher />
                </div>

                {/* Right: Price Info */}
                 <div className="flex flex-col items-end">
                    {q && (
                        <span className="text-lg font-mono-retro font-bold">
                            {getMidPrice(q).toFixed(q.decimal)}
                        </span>
                    )}
                 </div>
             </div>

             {/* Chart Area */}
             <div className="flex-1 relative w-full overflow-hidden">
                <CandlesChart symbol={selectedSymbol} decimal={q?.decimal} />
             </div>
          </div>
          
          <div className="h-[300px] lg:h-[40%] flex flex-col bg-background-light lg:overflow-hidden text-sm">
             <div className="p-2 border-b-2 border-text-main/10 flex justify-between items-center bg-background-light">
                <h3 className="font-bold text-xs uppercase tracking-wider px-2">Open Positions</h3>
             </div>
             <div className="flex-1 overflow-auto">
                <OpenOrders />
             </div>
          </div>
        </section>

        {/* Right Col: Trade Form (Mobile: Bottom, Desktop: Right) */}
        <aside className="lg:col-span-3 border-l-0 lg:border-l-3 border-text-main bg-background-light flex flex-col shrink-0 lg:h-full order-3">
           <div className="p-4 border-b-3 border-text-main bg-primary text-white">
              <h2 className="font-serif-heading text-2xl italic font-bold">EXECUTE</h2>
           </div>
           <div className="p-4 flex-1">
              <TradeForm />
           </div>
        </aside>

      </main>
    </div>
  );
}

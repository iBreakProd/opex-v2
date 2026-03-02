import { useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSessionStore } from "@/lib/session";
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
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import api from "@/lib/api";

export default function Trade() {
  useQuotesFeed();
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.userId);

  const navigate = useNavigate();

  const { mutate: handleLogout, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
    onError: (err: Error) => {
      console.error("Logout failed:", err);
    }
  });

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

      <nav className="h-16 border-b-3 border-text-main flex items-center justify-between px-6 bg-background-light shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-text-main flex items-center justify-center p-1 group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
              <img src="/opex.png" alt="OPEX Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif-heading font-bold text-2xl tracking-tight italic">OPEX</span>
          </Link>
          <div className="h-6 w-0.5 bg-text-main/20 mx-2"></div>

        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Equity</span>
            <span className="text-lg font-bold font-mono-retro">
              ${isBalanceLoading || !usdBalance
                ? "SYNCING..."
                : toDecimalNumber(equity, usdBalance.decimal).toLocaleString()}
            </span>
          </div>
           <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Balance</span>
            <span className="text-sm font-bold font-mono-retro">
              ${isBalanceLoading || !usdBalance
                ? "SYNCING..."
                : toDecimalNumber(usdBalance.balance, usdBalance.decimal).toLocaleString()}
            </span>
          </div>
          <button 
            className="p-2 hover:bg-red-100 text-chart-red transition-colors rounded-sm cursor-pointer disabled:opacity-50" 
            title="Log Out"
            onClick={() => handleLogout()}
            disabled={isLoggingOut}
          >
            <LogOut className={`w-5 h-5 ${isLoggingOut ? "animate-pulse" : ""}`} />
          </button>
        </div>
      </nav>


      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden min-h-0 bg-background-light">
        

        <aside className="lg:col-span-2 border-b-3 lg:border-b-0 lg:border-r-3 border-text-main bg-white/30 flex flex-col shrink-0 lg:h-full order-1">
          <div className="p-3 border-b-2 border-text-main/10 bg-background-light flex justify-between items-center cursor-pointer lg:cursor-default group" onClick={() => {
          }}>
            <h3 className="font-bold text-xs uppercase tracking-wider">Market Data</h3>
            <span className="lg:hidden text-[10px] text-text-main/60">// TAP_TO_EXPAND</span>
          </div>
          <div className="max-h-[200px] lg:max-h-none overflow-y-auto lg:flex-1 p-0">
             <QuotesTable />
          </div>
        </aside>


        <section className="lg:col-span-7 flex flex-col shrink-0 lg:h-full relative order-2 lg:overflow-hidden border-b-3 lg:border-b-0 border-text-main">

          <div className="h-[400px] lg:h-[60%] border-b-3 border-text-main relative bg-white/50 shrink-0 flex flex-col">

             <div className="h-14 border-b border-text-main/10 flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm shrink-0 z-20">

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


                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                   <TimeframeSwitcher />
                </div>


                 <div className="flex flex-col items-end">
                    {q && (
                        <span className="text-lg font-mono-retro font-bold">
                            {getMidPrice(q).toFixed(q.decimal)}
                        </span>
                    )}
                 </div>
             </div>


             <div className="flex-1 relative w-full overflow-hidden">
                <CandlesChart symbol={selectedSymbol} decimal={q?.decimal} />
             </div>
          </div>
          
          <div className="h-[300px] lg:h-[40%] flex flex-col bg-background-light lg:overflow-hidden text-sm">
             <div className="p-2 border-b-2 border-text-main/10 flex justify-between items-center bg-background-light">
                <h3 className="font-bold text-xs uppercase tracking-wider px-2">Open Positions</h3>
                <Link 
                  to="/past-orders" 
                  className="text-[10px] font-bold uppercase tracking-wider bg-text-main text-background-light hover:text-white hover:bg-text-main transition-colors px-3 py-1 border border-text-main/20 hover:border-text-main rounded-sm"
                >
                  Past Orders
                </Link>
             </div>
             <div className="flex-1 overflow-auto">
                <OpenOrders />
             </div>
          </div>
        </section>


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

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toDecimalNumber } from "@/lib/utils";

interface ClosedTrade {
  id: string;
  asset: string;
  type: string;
  quantity: number;
  openPrice: number;
  closePrice: number;
  pnl: number;
  decimal: number;
  liquidated: boolean;
  createdAt: string;
}

export default function PastOrders() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["closedOrders"],
    queryFn: async () => {
      const res = await api.get("/trade/closed");
      return res.data.trades as ClosedTrade[];
    },
  });

  return (
    <div className="min-h-screen w-screen bg-background-light text-text-main font-mono-retro flex flex-col">

      <nav className="h-16 border-b-3 border-text-main flex items-center justify-between px-6 bg-background-light shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-text-main flex items-center justify-center p-1 group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
              <img src="/opex.png" alt="OPEX Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif-heading font-bold text-2xl tracking-tight italic">
              OPEX
            </span>
          </Link>
          <div className="h-6 w-0.5 bg-text-main/20 mx-2"></div>
          <Link
            to="/trade"
            className="flex items-center gap-2 text-sm font-bold uppercase hover:bg-black/5 px-3 py-1.5 transition-colors border-2 border-transparent hover:border-text-main/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trade
          </Link>
        </div>
      </nav>


      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b-4 border-text-main pb-4">
            <h1 className="font-serif-heading text-4xl italic font-black uppercase">
              Past Orders
            </h1>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-sm font-bold opacity-60 uppercase tracking-wider">
                Your closed and liquidated positions
              </p>
              <p className="text-[10px] font-bold text-text-main/50 uppercase tracking-wider bg-text-main/5 inline-flex w-fit px-2 py-1 rounded-sm border border-text-main/10">
                * Recently closed orders will show up here within 5 minutes
              </p>
            </div>
          </div>

          <div className="border-3 border-text-main bg-white shadow-brutal overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b-3 border-text-main bg-text-main text-background-light uppercase tracking-wider text-xs font-black">
                  <th className="p-4">Date</th>
                  <th className="p-4">Asset</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Size</th>
                  <th className="p-4 text-right">Entry</th>
                  <th className="p-4 text-right">Exit</th>
                  <th className="p-4 text-right">PnL</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-text-main/20 font-medium">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center uppercase font-bold animate-pulse">
                      Loading your history...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center uppercase font-bold text-red-500">
                      Failed to load trades. Please try again later.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center uppercase font-bold opacity-60">
                      No past orders found.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  !isError &&
                  data?.map((trade) => {
                    const date = new Date(trade.createdAt).toLocaleString();
                    const isLong = trade.type.toLowerCase() === "long";
                    
                    const pnlReal = toDecimalNumber(trade.pnl, trade.decimal);
                    const isProfit = pnlReal > 0;
                    const pnlColor = isProfit ? "text-chart-green" : pnlReal < 0 ? "text-chart-red" : "text-text-main";

                    return (
                      <tr
                        key={trade.id}
                        className="hover:bg-black/5 transition-colors group cursor-default"
                      >
                        <td className="p-4 opacity-70 text-xs">
                          {date}
                        </td>
                        <td className="p-4 font-bold">{trade.asset}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 text-xs font-black uppercase border-2 ${
                              isLong
                                ? "border-chart-green text-chart-green"
                                : "border-chart-red text-chart-red"
                            }`}
                          >
                            {trade.type}
                          </span>
                        </td>
                        <td className="p-4 text-right tracking-tight">
                          {trade.quantity}
                        </td>
                        <td className="p-4 text-right tracking-tight opacity-80">
                          ${toDecimalNumber(trade.openPrice, trade.decimal).toLocaleString(undefined, { minimumFractionDigits: trade.decimal, maximumFractionDigits: trade.decimal })}
                        </td>
                        <td className="p-4 text-right tracking-tight opacity-80">
                          ${toDecimalNumber(trade.closePrice, trade.decimal).toLocaleString(undefined, { minimumFractionDigits: trade.decimal, maximumFractionDigits: trade.decimal })}
                        </td>
                        <td className={`p-4 text-right font-black tracking-tight ${pnlColor}`}>
                          {pnlReal > 0 ? "+" : ""}${pnlReal.toLocaleString(undefined, { minimumFractionDigits: trade.decimal, maximumFractionDigits: trade.decimal })}
                        </td>
                        <td className="p-4 text-center">
                          {trade.liquidated ? (
                            <span className="inline-block bg-chart-red text-white text-[10px] font-black uppercase px-2 py-1 shadow-sm">
                              Liquidated
                            </span>
                          ) : (
                            <span className="inline-block bg-black text-white text-[10px] font-black uppercase px-2 py-1 shadow-sm">
                              Closed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

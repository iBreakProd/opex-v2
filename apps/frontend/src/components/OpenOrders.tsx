import { useMemo } from "react";
import {
  useOpenOrdersStore,
  useFetchOpenOrders,
  useCloseOrder,
} from "@/lib/openOrdersStore";
import { useQuotesStore } from "@/lib/quotesStore";
import { toDecimalNumber } from "@/lib/utils";
import { X } from "lucide-react";

function appToDisplaySymbol(backendSymbol: string): string {
  return backendSymbol.replace("_USDC_PERP", "USDC").replaceAll("_", "");
}

export default function OpenOrders() {
  const { isLoading, isError } = useFetchOpenOrders();
  const { mutate: closeOrder } = useCloseOrder();
  const orders = Object.values(useOpenOrdersStore((s) => s.ordersById));
  const quotes = useQuotesStore((s) => s.quotes);

  const rows = useMemo(() => {
    return orders.map((o) => {
      const appSym = appToDisplaySymbol(o.asset);
      const q = quotes[appSym];
      const decimal = q?.decimal ?? 4;
      const current = q
        ? o.type === "long"
          ? q.bid_price
          : q.ask_price
        : o.openPrice;
      const diffInt =
        o.type === "long" ? current - o.openPrice : o.openPrice - current;
      const pnlDec = toDecimalNumber(diffInt, decimal) * o.quantity;
      return { ...o, appSym, decimal, current, pnlDec };
    });
  }, [orders, quotes]);

  return (
    <div className="w-full">
      {/* Mobile card view */}
      <div className="lg:hidden flex flex-col gap-1.5 p-1.5">
        {isLoading && (
          <div className="text-center text-xs p-4 text-text-main/40 font-bold uppercase">// SYNCING_ORDERS...</div>
        )}
        {isError && (
          <div className="text-center text-xs p-4 text-chart-red font-bold uppercase">// SYNC_ERROR_RETRYING...</div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="text-center text-xs p-8 text-text-main/40 font-bold uppercase">// NO_OPEN_POSITIONS</div>
        )}
        {!isLoading && !isError && rows.map((r) => (
          <div key={r.id} className="border-2 border-text-main bg-white/50 p-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 font-bold uppercase font-mono-retro ${
                  r.type === "long" ? "bg-chart-green text-text-main" : "bg-chart-red text-white"
                }`}>{r.type}</span>
                <span className="font-bold text-sm font-mono-retro">{r.appSym}</span>
              </div>
              <button
                onClick={() => closeOrder(r.id)}
                className="p-1.5 hover:bg-chart-red hover:text-white text-chart-red transition-colors border border-transparent hover:border-chart-red"
                title="Close Position"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between mt-2 text-xs font-mono-retro text-text-main/70">
              <span>Entry: {toDecimalNumber(r.openPrice, r.decimal)}</span>
              <span>Mark: {toDecimalNumber(r.current, r.decimal)}</span>
            </div>
            <div className="flex justify-between mt-1 text-xs font-mono-retro">
              <span className="text-text-main/70">{r.quantity} × {r.leverage}x</span>
              <span className={`font-bold ${r.pnlDec >= 0 ? "text-chart-green" : "text-chart-red"}`}>
                {r.pnlDec > 0 ? "+" : ""}{r.pnlDec.toFixed(r.decimal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <table className="hidden lg:table w-full border-collapse text-left">
        <thead className="bg-background-light sticky top-0 font-mono-retro border-b border-text-main/10">
          <tr>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider">Asset</th>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider text-center">Type</th>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider text-right">Entry</th>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider text-right">Mark</th>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider text-right">Qty</th>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider text-right">Lev</th>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider text-right">PnL</th>
            <th className="p-3 text-[10px] font-bold uppercase text-text-main/60 tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="font-mono-retro text-sm">
          {isLoading ? (
            <tr>
              <td
                className="p-8 text-center text-xs text-text-main/40 font-bold uppercase"
                colSpan={8}
              >
                // SYNCING_ORDERS...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td
                className="p-8 text-center text-xs text-chart-red font-bold uppercase"
                colSpan={8}
              >
                // SYNC_ERROR_RETRYING...
              </td>
            </tr>
          ) : null}

          {!isLoading &&
            !isError &&
            rows.map((r) => (
            <tr key={r.id} className="border-b border-text-main/5 hover:bg-white/50 transition-colors">
              <td className="p-3 font-bold">{r.appSym}</td>
              <td className={`p-3 text-center font-bold uppercase text-xs ${r.type === 'long' ? 'text-chart-green' : 'text-chart-red'}`}>
                {r.type}
              </td>
              <td className="p-3 text-right">
                {toDecimalNumber(r.openPrice, r.decimal)}
              </td>
              <td className="p-3 text-right">
                {toDecimalNumber(r.current, r.decimal)}
              </td>
              <td className="p-3 text-right font-bold">{r.quantity}</td>
              <td className="p-3 text-right opacity-60">{r.leverage}x</td>
              <td
                className={`p-3 text-right font-bold ${
                  r.pnlDec >= 0 ? "text-chart-green" : "text-chart-red"
                }`}
              >
                {r.pnlDec > 0 ? "+" : ""}{(r.pnlDec).toFixed(r.decimal)}
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={() => closeOrder(r.id)}
                  className="p-1 hover:bg-chart-red hover:text-white text-text-main transition-colors border border-transparent hover:border-chart-red rounded-sm"
                  title="Close Position"
                >
                  <X className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {!isLoading && !isError && rows.length === 0 ? (
            <tr>
              <td
                className="p-12 text-center text-xs text-text-main/40 font-bold uppercase"
                colSpan={8}
              >
                // NO_OPEN_POSITIONS
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

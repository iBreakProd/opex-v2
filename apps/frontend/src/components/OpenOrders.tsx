import { useMemo } from "react";
import {
  useOpenOrdersStore,
  useFetchOpenOrders,
  useCloseOrder,
} from "@/lib/openOrdersStore";
import { useQuotesStore } from "@/lib/quotesStore";
import { toDecimalNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function appToDisplaySymbol(backendSymbol: string): string {
  return backendSymbol.replace("_USDC_PERP", "USDC").replaceAll("_", "");
}

export default function OpenOrders() {
  const { isLoading, isFetching, isError } = useFetchOpenOrders();
  const { mutate: closeOrder, isPending: isClosing } = useCloseOrder();
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b px-2 py-2 text-left text-sm font-medium">
              Asset
            </th>
            <th className="border-b px-2 py-2 text-center text-sm font-medium">
              Type
            </th>
            <th className="border-b px-2 py-2 text-right text-sm font-medium">
              Open
            </th>
            <th className="border-b px-2 py-2 text-right text-sm font-medium">
              Current
            </th>
            <th className="border-b px-2 py-2 text-right text-sm font-medium">
              Qty
            </th>
            <th className="border-b px-2 py-2 text-right text-sm font-medium">
              Levg
            </th>
            <th className="border-b px-2 py-2 text-right text-sm font-medium">
              PnL
            </th>
            <th className="border-b px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {isLoading || isFetching ? (
            <tr>
              <td
                className="px-3 py-3 text-center text-muted-foreground"
                colSpan={8}
              >
                Loading open orders…
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td
                className="px-3 py-3 text-center text-red-600 text-xs"
                colSpan={8}
              >
                Could not load open orders. Please try again.
              </td>
            </tr>
          ) : null}

          {!isLoading &&
            !isFetching &&
            !isError &&
            rows.map((r) => (
            <tr key={r.id}>
              <td className="border-b px-2 py-2">{r.appSym}</td>
              <td className="border-b px-2 py-2 text-center capitalize">
                {r.type}
              </td>
              <td className="border-b px-2 py-2 text-right">
                {toDecimalNumber(r.openPrice, r.decimal)}
              </td>
              <td className="border-b px-2 py-2 text-right">
                {toDecimalNumber(r.current, r.decimal)}
              </td>
              <td className="border-b px-2 py-2 text-right">{r.quantity}</td>
              <td className="border-b px-2 py-2 text-right">{r.leverage}</td>
              <td
                className={`border-b px-2 py-2 text-right ${
                  r.pnlDec >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {(r.pnlDec * r.leverage).toFixed(r.decimal)}
              </td>
              <td className="border-b px-2 py-2 text-right">
                <Button
                  onClick={() => closeOrder(r.id)}
                  disabled={isClosing}
                  size="sm"
                  variant="destructive"
                >
                  Close
                </Button>
              </td>
            </tr>
          ))}
          {!isLoading && !isFetching && !isError && rows.length === 0 ? (
            <tr>
              <td
                className="px-3 py-3 text-center text-muted-foreground"
                colSpan={8}
              >
                No open orders
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

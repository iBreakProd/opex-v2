import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useQuotesStore } from "@/lib/quotesStore";
import { appToBackendSymbol } from "@/lib/symbols";
import { useOpenOrdersStore, type OpenOrder } from "@/lib/openOrdersStore";
import type { UsdBalance } from "@/lib/balance";
import { toDecimalNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function TradeForm() {
  const { selectedSymbol, quotes } = useQuotesStore();
  const q = quotes[selectedSymbol];
  const [type, setType] = useState<"long" | "short">("long");
  const [quantity, setQuantity] = useState(0);
  const [leverage, setLeverage] = useState(1);
  const [slippage, setSlippage] = useState(0.1);

  const openPrice = q ? (type === "long" ? q.ask_price : q.bid_price) : 0;
  const decimal = q ? q.decimal : 4;

  const upsert = useOpenOrdersStore((s) => s.upsert);
  const qc = useQueryClient();
  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: async () => {
      const slippageBips = Math.round(Number(slippage) * 100);
      const payload = {
        asset: appToBackendSymbol(selectedSymbol),
        type,
        quantity: Number(quantity),
        leverage: Number(leverage),
        slippage: slippageBips,
        openPrice,
        decimal,
      };
      const { data } = await api.post("/trade/open", payload);
      return data as {
        message: string;
        order?: OpenOrder;
        orderId?: string;
        openOrders?: OpenOrder[];
        usdBalance?: UsdBalance;
      };
    },
    onSuccess: (data) => {
      if (data?.order) {
        upsert(data.order);
      }
      if (data?.openOrders) {
        const setAll = useOpenOrdersStore.getState().setAll;
        setAll(data.openOrders);
      }
      if (data?.usdBalance) {
        qc.setQueryData<UsdBalance>(["balance.usd"], data.usdBalance);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate();
      }}
      className="grid gap-2.5"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("long")}
          className={`flex-1 rounded-md px-3 py-2 font-semibold transition-colors focus-visible:outline-none ${
            type === "long"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          Long
        </button>
        <button
          type="button"
          onClick={() => setType("short")}
          className={`flex-1 rounded-md text-black px-3 py-2 font-semibold transition-colors focus-visible:outline-none ${
            type === "short"
              ? "bg-red-600 text-white shadow-xs"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          Short
        </button>
      </div>

      <label className="grid gap-1.5 text-xs">
        Asset
        <input
          value={selectedSymbol}
          disabled
          className="rounded-md border bg-background px-2.5 py-2"
        />
      </label>

      <label className="grid gap-1.5 text-xs">
        Quantity
        <input
          type="number"
          step="0.0001"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
          className="rounded-md border bg-background px-2.5 py-2"
        />
      </label>

      <label className="grid gap-1.5 text-xs">
        Leverage
        <input
          type="number"
          step="1"
          min={1}
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          required
          className="rounded-md border bg-background px-2.5 py-2"
        />
      </label>

      <label className="grid gap-1.5 text-xs">
        Slippage (%)
        <input
          type="number"
          step="0.01"
          value={slippage}
          onChange={(e) => setSlippage(Number(e.target.value))}
          required
          className="rounded-md border bg-background px-2.5 py-2"
        />
      </label>

      <div className="grid gap-1 text-xs">
        <div>
          Open Price: {openPrice ? toDecimalNumber(openPrice, decimal) : "-"}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="h-10 font-semibold">
        {isPending ? "Placing…" : "Place Order"}
      </Button>

      {isSuccess ? (
        <div className="text-xs text-emerald-600">Order placed.</div>
      ) : null}
      {error ? (
        <div className="text-xs text-red-600">
          {(error as unknown as { response: { data: { message: string } } })
            .response.data.message || "Failed"}
        </div>
      ) : null}
    </form>
  );
}

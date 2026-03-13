import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useQuotesStore } from "@/lib/quotesStore";
import { appToBackendSymbol } from "@/lib/symbols";
import { useOpenOrdersStore, type OpenOrder } from "@/lib/openOrdersStore";
import type { UsdBalance } from "@/lib/balance";
import { toDecimalNumber } from "@/lib/utils";
import { ArrowRight, AlertCircle } from "lucide-react";

interface TradeFormProps {
  defaultSide?: "long" | "short";
  onClose?: () => void;
}

export default function TradeForm({ defaultSide, onClose }: TradeFormProps) {
  const { selectedSymbol, quotes } = useQuotesStore();
  const q = quotes[selectedSymbol];
  const [type, setType] = useState<"long" | "short">(defaultSide ?? "long");
  const [quantity, setQuantity] = useState("0.1");
  const [leverage, setLeverage] = useState("10");
  const [slippage, setSlippage] = useState("0.5");
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openPrice = q ? (type === "long" ? q.ask_price : q.bid_price) : 0;
  const decimal = q ? q.decimal : 4;

  const upsert = useOpenOrdersStore((s) => s.upsert);
  const qc = useQueryClient();
  
  const validate = () => {
      const newErrors: Record<string, string> = {};
      const qty = Number(quantity);

      if (isNaN(qty) || qty <= 0) newErrors.quantity = "Quantity must be > 0";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

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
      if (data?.order) upsert(data.order);
      if (data?.openOrders) useOpenOrdersStore.getState().setAll(data.openOrders);
      if (data?.usdBalance) qc.setQueryData<UsdBalance>(["balance.usd"], data.usdBalance);
      onClose?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
        mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <div className="flex bg-text-main p-1 gap-1">
        <button
          type="button"
          onClick={() => setType("long")}
          className={`flex-1 py-2 text-sm font-bold font-mono-retro uppercase tracking-wider transition-all ${
            type === "long"
              ? "bg-chart-green text-background-dark shadow-sm"
              : "bg-transparent text-background-light hover:bg-white/10"
          }`}
        >
          Long
        </button>
        <button
          type="button"
          onClick={() => setType("short")}
          className={`flex-1 py-2 text-sm font-bold font-mono-retro uppercase tracking-wider transition-all ${
            type === "short"
              ? "bg-chart-red text-background-light shadow-sm"
              : "bg-transparent text-background-light hover:bg-white/10"
          }`}
        >
          Short
        </button>
      </div>

      <div className="space-y-3">

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-text-main/60">Asset</span>
            <div className="bg-white/50 border-2 border-text-main/20 px-2 py-2 text-sm font-mono-retro font-bold text-text-main">
                {selectedSymbol}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-text-main/60">Quantity</span>
            <div className="relative">
                <input
                    type="number"
                    step="0.0001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={`w-full bg-white border-2 px-2 py-2 text-sm font-mono-retro outline-none focus:bg-background-light transition-all ${errors.quantity ? 'border-chart-red' : 'border-text-main focus:shadow-brutal focus:shadow-text-main'}`}
                    placeholder="0.00"
                />
            </div>
            {errors.quantity && <span className="text-[10px] text-chart-red font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.quantity}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-text-main/60">Leverage (x)</span>
                <select
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className="w-full bg-white border-2 border-text-main px-2 py-2 text-sm font-mono-retro outline-none focus:bg-background-light transition-all appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100].map((v) => (
                    <option key={v} value={v}>{v}x</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-text-main/60">Slippage (%)</span>
                <select
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="w-full bg-white border-2 border-text-main px-2 py-2 text-sm font-mono-retro outline-none focus:bg-background-light transition-all appearance-none cursor-pointer"
                >
                  {[0.1, 0.2, 0.3, 0.5, 1.0, 2.0, 5.0].map((v) => (
                    <option key={v} value={v}>{v}%</option>
                  ))}
                </select>
              </div>
          </div>
      </div>

      <div className="bg-white border-2 border-text-main/10 p-2 space-y-1.5">
         <div className="flex justify-between items-baseline">
            <span className="text-[10px] uppercase font-bold text-text-main/60">Est. Entry Price</span>
            <span className="font-mono-retro font-bold text-sm">
                {openPrice ? toDecimalNumber(openPrice, decimal) : "-"}
            </span>
         </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] uppercase font-bold text-text-main/60">Position Size</span>
            <span className="font-mono-retro font-bold text-sm">
                {(Number(quantity) * (openPrice ? toDecimalNumber(openPrice, decimal) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
         </div>
         <div className="flex justify-between items-baseline border-t border-text-main/10 pt-2 mt-2">
            <span className="text-[10px] uppercase font-bold text-text-main/60">Margin Required</span>
            <span className="font-mono-retro font-bold text-sm text-primary">
                {((Number(quantity) * (openPrice ? toDecimalNumber(openPrice, decimal) : 0)) / Number(leverage || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
         </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-text-main text-background-light py-3 font-bold font-mono-retro text-sm shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 !border-2 !border-background-light hover:!border-text-main hover:bg-background-light hover:text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
        >
        {isPending ? "EXECUTING..." : "PLACE_ORDER"}
        {!isPending && <ArrowRight className="w-4 h-4" />}
      </button>

      {isSuccess && (
        <div className="bg-chart-green/20 border-l-4 border-chart-green p-2 text-xs font-bold text-text-main">
          ORDER EXECUTED SUCCESSFULLY
        </div>
      )}
      
      {error && (
        <div className="bg-chart-red/20 border-l-4 border-chart-red p-2 text-xs font-bold text-text-main">
          {(error as unknown as { response: { data: { message: string } } }).response?.data?.message || "EXECUTION FAILED"}
        </div>
      )}
    </form>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useQuotesStore } from "@/lib/quotesStore";
import { appToBackendSymbol } from "@/lib/symbols";
import { useOpenOrdersStore, type OpenOrder } from "@/lib/openOrdersStore";
import type { UsdBalance } from "@/lib/balance";
import { toDecimalNumber } from "@/lib/utils";
import { ArrowRight, AlertCircle } from "lucide-react";

export default function TradeForm() {
  const { selectedSymbol, quotes } = useQuotesStore();
  const q = quotes[selectedSymbol];
  const [type, setType] = useState<"long" | "short">("long");
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
      const lev = Number(leverage);
      const slip = Number(slippage);
      
      if (isNaN(qty) || qty <= 0) newErrors.quantity = "Quantity must be > 0";
      if (isNaN(lev)) {
        newErrors.leverage = "Invalid leverage";
      } else if (lev < 1 || lev > 100) {
        newErrors.leverage = "Leverage must be between 1 and 100";
      } else if (!Number.isInteger(lev)) {
        newErrors.leverage = "Leverage must be an integer";
      }
      
      if (isNaN(slip) || slip < 0) newErrors.slippage = "Slippage must be >= 0";
      
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
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("\n\n[TradeForm] Submit Triggered");
    if (validate()) {
        const slippageBips = Math.round(Number(slippage) * 100);
        const payload = {
            asset: selectedSymbol,
            type,
            quantity: Number(quantity),
            leverage: Number(leverage),
            slippage: slippageBips,
            openPrice,
            decimal,
        };
        console.log("\n\n[TradeForm] Validation Passed. Submitting Payload:", payload);
        mutate();
    } else {
        console.warn("\n\n[TradeForm] Validation Failed. Errors:", errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Type Selector */}
      <div className="flex bg-text-main p-1 gap-1">
        <button
          type="button"
          onClick={() => setType("long")}
          className={`flex-1 py-3 font-bold font-mono-retro uppercase tracking-wider transition-all ${
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
          className={`flex-1 py-3 font-bold font-mono-retro uppercase tracking-wider transition-all ${
            type === "short"
              ? "bg-chart-red text-background-light shadow-sm"
              : "bg-transparent text-background-light hover:bg-white/10"
          }`}
        >
          Short
        </button>
      </div>

      <div className="space-y-4">
          {/* Asset Display */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-text-main/60">Asset</span>
            <div className="bg-white/50 border-2 border-text-main/20 px-3 py-3 font-mono-retro font-bold text-text-main">
                {selectedSymbol}
            </div>
          </div>

          {/* Quantity Input */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-text-main/60">Quantity</span>
            <div className="relative">
                <input
                    type="number"
                    step="0.0001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={`w-full bg-white border-2 px-3 py-3 font-mono-retro outline-none focus:bg-background-light transition-all ${errors.quantity ? 'border-chart-red' : 'border-text-main focus:shadow-brutal focus:shadow-text-main'}`}
                    placeholder="0.00"
                />
            </div>
            {errors.quantity && <span className="text-[10px] text-chart-red font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.quantity}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* Leverage Input */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-text-main/60">Leverage (x)</span>
                <input
                    type="number"
                    step="1"
                    min="1"
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className={`w-full bg-white border-2 px-3 py-3 font-mono-retro outline-none focus:bg-background-light transition-all ${errors.leverage ? 'border-chart-red' : 'border-text-main focus:shadow-brutal focus:shadow-text-main'}`}
                />
                 {errors.leverage && <span className="text-[10px] text-chart-red font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.leverage}</span>}
              </div>

              {/* Slippage Input */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-text-main/60">Slippage (%)</span>
                <input
                    type="number"
                    step="0.1"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className={`w-full bg-white border-2 px-3 py-3 font-mono-retro outline-none focus:bg-background-light transition-all ${errors.slippage ? 'border-chart-red' : 'border-text-main focus:shadow-brutal focus:shadow-text-main'}`}
                />
                 {errors.slippage && <span className="text-[10px] text-chart-red font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.slippage}</span>}
              </div>
          </div>
      </div>

      <div className="bg-white border-2 border-text-main/10 p-3 space-y-2">
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
        className="w-full bg-text-main text-background-light py-4 font-bold font-mono-retro text-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 !border-2 !border-background-light hover:!border-text-main hover:bg-background-light hover:text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
        >
        {isPending ? "EXECUTING..." : "PLACE_ORDER"}
        {!isPending && <ArrowRight className="w-5 h-5" />}
      </button>

      {isSuccess && (
        <div className="bg-chart-green/20 border-l-4 border-chart-green p-3 text-xs font-bold text-text-main">
          ORDER EXECUTED SUCCESSFULLY
        </div>
      )}
      
      {error && (
        <div className="bg-chart-red/20 border-l-4 border-chart-red p-3 text-xs font-bold text-text-main">
          {(error as unknown as { response: { data: { message: string } } }).response?.data?.message || "EXECUTION FAILED"}
        </div>
      )}
    </form>
  );
}

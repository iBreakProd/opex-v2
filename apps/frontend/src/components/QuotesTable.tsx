import { useEffect, useRef, useState } from "react";
import { useQuotesStore } from "@/lib/quotesStore";
import { formatPrice } from "@/lib/quotesStore";

function FlashPrice({ value, decimal, isSelected }: { value: number; decimal: number; isSelected: boolean }) {
  const prevRef = useRef<number | null>(null);
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev === null || prev === value) return;
    setDir(value > prev ? "up" : "down");
    const t = setTimeout(() => setDir(null), 1000);
    return () => clearTimeout(t);
  }, [value]);

  const cls =
    dir === "up" ? "text-chart-green" : dir === "down" ? "text-chart-red" : isSelected ? "text-white/90" : "text-text-main/80";

  return (
    <span className={`transition-colors duration-300 ${cls}`}>
      {formatPrice(value, decimal)}
    </span>
  );
}

export default function QuotesTable() {
  const { quotes, selectedSymbol, setSelectedSymbol } = useQuotesStore();
  // Ensure consistent order
  const symbols = ["BTCUSDC", "ETHUSDC", "SOLUSDC"];

  return (
    <div className="flex flex-col gap-2 p-2 w-full">
        {symbols.map((symbol) => {
            const q = quotes[symbol];
            const isSelected = selectedSymbol === symbol;
            
            return (
                <button
                    key={symbol}
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`
                        group relative flex flex-col items-start p-4 w-full text-left transition-all duration-200 border-2
                        ${isSelected 
                            ? "bg-primary border-primary text-white shadow-brutal translate-x-[2px] translate-y-[2px]" 
                            : "bg-white border-text-main/10 hover:border-text-main hover:shadow-brutal hover:-translate-y-[2px] text-text-main"
                        }
                    `}
                >
                    <div className="flex justify-between items-center w-full mb-2">
                        <span className={`font-bold font-mono-retro text-lg tracking-tight ${isSelected ? "text-white" : "text-text-main"}`}>
                            {symbol.replace("USDC", "")}
                        </span>
                    </div>
                    
                    {q ? (
                        <div className="w-full flex flex-col gap-1 mt-1">
                             <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-white/60" : "text-text-main/40"}`}>Bid</span>
                                <span className={`font-mono-retro font-bold text-base`}>
                                     <FlashPrice value={q.bid_price} decimal={q.decimal} isSelected={isSelected} />
                                </span>
                             </div>
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-white/60" : "text-text-main/40"}`}>Ask</span>
                                <span className={`font-mono-retro font-bold text-base`}>
                                     <FlashPrice value={q.ask_price} decimal={q.decimal} isSelected={isSelected} />
                                </span>
                             </div>
                        </div>
                    ) : (
                        <div className="animate-pulse h-8 w-24 bg-current opacity-10 rounded"></div>
                    )}
                    
                    {/* Active Indicator Strip */}
                    {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-chart-green"></div>
                    )}
                </button>
            );
        })}
    </div>
  );
}

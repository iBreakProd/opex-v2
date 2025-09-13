import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type UsdBalance = { balance: number; decimal: number };

export function useUsdBalance() {
  return useQuery<UsdBalance>({
    queryKey: ["balance.usd"],
    queryFn: async () => {
      const { data } = await api.get("/balance/usd");
      const bal = Number(data?.data?.balance ?? 0);
      const dec = Number(data?.data?.decimal ?? 4);
      return { balance: bal, decimal: dec };
    },
    staleTime: 2_500,
  });
}

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSessionStore } from "@/lib/session";

export type UsdBalance = { balance: number; decimal: number };

export function useUsdBalance(options?: { retry?: boolean | number }) {
  return useQuery<UsdBalance>({
    queryKey: ["balance.usd"],
    queryFn: async () => {
      const { data } = await api.get<{ data?: { balance?: number; decimal?: number }; userId?: string }>("/balance/usd");
      const bal = Number(data?.data?.balance ?? 0);
      const dec = Number(data?.data?.decimal ?? 4);
      if (data?.userId) useSessionStore.getState().setUserId(data.userId);
      return { balance: bal, decimal: dec };
    },
    staleTime: 2_500,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: options?.retry,
  });
}

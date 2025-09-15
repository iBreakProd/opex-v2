import { create } from "zustand";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type OpenOrder = {
  id: string;
  type: "long" | "short";
  leverage: number;
  asset: string;
  margin: number;
  quantity: number;
  openPrice: number;
};

type OpenOrdersState = {
  ordersById: Record<string, OpenOrder>;
  setAll: (orders: OpenOrder[]) => void;
  upsert: (order: OpenOrder) => void;
  remove: (orderId: string) => void;
};

export const useOpenOrdersStore = create<OpenOrdersState>((set) => ({
  ordersById: {},
  setAll: (orders) =>
    set({ ordersById: Object.fromEntries(orders.map((o) => [o.id, o])) }),
  upsert: (order) =>
    set((s) => ({ ordersById: { ...s.ordersById, [order.id]: order } })),
  remove: (orderId) =>
    set((s) => {
      const copy = { ...s.ordersById };
      delete copy[orderId];
      return { ordersById: copy };
    }),
}));

export function useFetchOpenOrders() {
  const setAll = useOpenOrdersStore((s) => s.setAll);
  return useQuery({
    queryKey: ["openOrders"],
    queryFn: async () => {
      const { data } = await api.get("/trade/open");
      const orders = (data?.trades ??
        data?.orders ??
        data ??
        []) as OpenOrder[];
      setAll(orders);
      return orders;
    },
    staleTime: 5_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useCloseOrder() {
  const setAll = useOpenOrdersStore((s) => s.setAll);
  const qc = useQueryClient();
  return useMutation<
    {
      message: string;
      openOrders?: OpenOrder[];
      usdBalance?: { balance: number; decimal: number };
    },
    unknown,
    string
  >({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post("/trade/close", { orderId });
      return data as {
        message: string;
        openOrders?: OpenOrder[];
        usdBalance?: { balance: number; decimal: number };
      };
    },
    onSuccess: (data, orderId) => {
      if (data?.openOrders) {
        setAll(data.openOrders);
      } else {
        const remove = useOpenOrdersStore.getState().remove;
        remove(orderId);
      }
      if (data?.usdBalance) {
        qc.setQueryData(["balance.usd"], data.usdBalance);
      }
    },
  });
}

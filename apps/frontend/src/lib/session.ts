import { create } from "zustand";
import { useEffect } from "react";
import { useUsdBalance } from "@/lib/balance";

type SessionState = {
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  userId: string | null;
  setUserId: (v: string | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  userId: null,
  setUserId: (v) => set({ userId: v }),
}));

export function useSessionProbe() {
  const setAuthenticated = useSessionStore((s) => s.setAuthenticated);
  const query = useUsdBalance({ retry: false });

  useEffect(() => {
    if (query.isSuccess) {
      setAuthenticated(true);
    }
    if (query.isError) setAuthenticated(false);
  }, [query.isSuccess, query.isError, setAuthenticated]);

  return query;
}

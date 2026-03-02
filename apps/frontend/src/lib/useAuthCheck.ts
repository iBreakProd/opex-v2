import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "./api";
import { useSessionStore } from "./session";

interface WhoAmIResponse {
  message: string;
  userId: string;
}

export function useAuthCheck() {
  const setAuthenticated = useSessionStore((s) => s.setAuthenticated);
  const setUserId = useSessionStore((s) => s.setUserId);

  const query = useQuery({
    queryKey: ["auth_whoami"],
    queryFn: async () => {
      const res = await api.get("/auth/whoami");
      return res.data as WhoAmIResponse;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (query.isSuccess && query.data?.userId) {
      setAuthenticated(true);
      setUserId(query.data.userId);
    }
    if (query.isError) {
      setAuthenticated(false);
      setUserId(null);
    }
  }, [query.isSuccess, query.isError, query.data?.userId, setAuthenticated, setUserId]);

  return query;
}

import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { useSessionStore } from "./session";

export function useGuestSession() {
  const setAuthenticated = useSessionStore((s) => s.setAuthenticated);
  const setUserId = useSessionStore((s) => s.setUserId);
  const setIsGuest = useSessionStore((s) => s.setIsGuest);

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/guest");
      return data as { userId: string; isGuest: boolean };
    },
    onSuccess: (data) => {
      setAuthenticated(true);
      setUserId(data.userId);
      setIsGuest(true);
    },
  });
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuthCheck } from "@/lib/useAuthCheck";
import { useSessionStore } from "@/lib/session";

export default function ProtectedRoute() {
  const { isLoading, isSuccess } = useAuthCheck();
  const isGuest = useSessionStore((s) => s.isGuest);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light font-mono-retro flex items-center justify-center">
        <div className="text-text-main font-bold uppercase animate-pulse">
          Verifying Identity...
        </div>
      </div>
    );
  }

  if (!isSuccess || isGuest) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

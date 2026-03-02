import { Navigate, Outlet } from "react-router-dom";
import { useAuthCheck } from "@/lib/useAuthCheck";

export default function ProtectedRoute() {
  const { isLoading, isSuccess } = useAuthCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light font-mono-retro flex items-center justify-center">
        <div className="text-text-main font-bold uppercase animate-pulse">
          Verifying Identity...
        </div>
      </div>
    );
  }

  if (!isSuccess) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

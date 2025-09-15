import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Trade from "@/pages/Trade";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";
import ProtectedRoute from "@/components/ProtectedRoute";

const routes = [
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/trade", element: <Trade /> }],
  },
  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "*", element: <NotFound /> },
];

const router = (import.meta.env.PROD ? createHashRouter : createBrowserRouter)(
  routes
);

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);

export default Root;

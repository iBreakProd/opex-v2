import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Trade from "@/pages/Trade";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";
import ProtectedRoute from "@/components/ProtectedRoute";
import PastOrders from "@/pages/PastOrders";
import Docs from "@/pages/Docs";

const routes = [
  { path: "/", element: <Landing /> },
  { path: "/docs", element: <Docs /> },
  { path: "/login", element: <Login /> },
  { path: "/trade", element: <Trade /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/past-orders", element: <PastOrders /> }
    ],
  },
  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter(routes);

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);

export default Root;

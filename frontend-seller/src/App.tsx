import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthenticateWithRedirectCallback, useAuth, useUser } from "@clerk/clerk-react";
import { useAuthStore } from "./store/authStore";
import api from "./api/axios";

import ProtectedRoute from "./components/ProtectedRoute";
import SellerAuthPage from "./pages/auth/SellerAuthPage";
import DocumentUploadPage from "./pages/DocumentUploadPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import DeclinedPage from "./pages/DeclinedPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import OrdersPage from "./pages/Orders";
import PayoutsPage from "./pages/Payouts";
import SellerReviewsPage from "./pages/reviews/SellerReviewsPage";

function GlobalSync({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const setUser = useAuthStore((s) => s.setUser);
  const [interceptorReady, setInterceptorReady] = useState(false);

  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Failed to get token:", err);
      }
      return config;
    });
    setInterceptorReady(true);
    return () => {
      api.interceptors.request.eject(reqInterceptor);
    };
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn || !clerkUser || !interceptorReady) return;
    (async () => {
      try {
        const fd = new FormData();
        fd.append("clerk_id", clerkUser.id);
        fd.append("email", clerkUser.primaryEmailAddress?.emailAddress ?? "");
        fd.append("full_name", clerkUser.fullName ?? clerkUser.firstName ?? "Seller");
        fd.append("role", "seller");
        const res = await api.post("/auth/sync-user", fd);
        setUser(res.data.user);
      } catch (err) {
        console.error("Global sync failed:", err);
      }
    })();
  }, [isSignedIn, clerkUser?.id, interceptorReady]);

  if (!interceptorReady) return null;
  return <>{children}</>;
}

export default function App() {
  return (
    <GlobalSync>
      <Routes>
        {/* Clerk SSO callback */}
        <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

        {/* Public — Clerk OAuth entry */}
        <Route path="/login" element={<SellerAuthPage />} />
        <Route path="/signup" element={<SellerAuthPage />} />

        {/* Post-OAuth flow pages */}
        <Route path="/upload-documents" element={<DocumentUploadPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/declined" element={<DeclinedPage />} />

        {/* Protected dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/payouts" element={<PayoutsPage />} />
          <Route path="/reviews" element={<SellerReviewsPage />} />
        </Route>
      </Routes>
    </GlobalSync>
  );
}
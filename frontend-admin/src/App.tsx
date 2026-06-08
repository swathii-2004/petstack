import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useAuthStore } from "./store/authStore";
import api from "./api/axios";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminAuthPage from "./pages/auth/AdminAuthPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import ApprovalsPage from "./pages/approvals/ApprovalsPage";
import UsersPage from "./pages/users/UsersPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

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
        fd.append("full_name", clerkUser.fullName ?? clerkUser.firstName ?? "Admin");
        fd.append("role", "admin");
        
        const res = await api.post("/auth/sync-user", fd);
        setUser(res.data.user);
      } catch (err) {
        console.error("[GlobalSync] Global sync failed:", err);
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
        <Route path="/login" element={<AdminAuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </GlobalSync>
  );
}
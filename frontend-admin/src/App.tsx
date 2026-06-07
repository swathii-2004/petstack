import { useEffect } from "react";
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

function GlobalSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    console.log("[GlobalSync] Running effect. isSignedIn:", isSignedIn, "clerkUser:", clerkUser?.id);
    if (!isSignedIn || !clerkUser) {
      console.log("[GlobalSync] Skipping sync: not signed in or no clerk user yet.");
      return;
    }
    
    (async () => {
      try {
        console.log("[GlobalSync] Fetching Clerk token...");
        const token = await getToken();
        console.log("[GlobalSync] Token fetched successfully.");
        
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        const fd = new FormData();
        fd.append("clerk_id", clerkUser.id);
        fd.append("email", clerkUser.primaryEmailAddress?.emailAddress ?? "");
        fd.append("full_name", clerkUser.fullName ?? clerkUser.firstName ?? "Admin");
        fd.append("role", "admin");
        
        console.log(`[GlobalSync] Calling /auth/sync-user with email: ${clerkUser.primaryEmailAddress?.emailAddress}`);
        const res = await api.post("/auth/sync-user", fd);
        
        console.log("[GlobalSync] /auth/sync-user response:", res.data);
        setUser(res.data.user);
        console.log("[GlobalSync] Zustand store updated with new user data.");
      } catch (err) {
        console.error("[GlobalSync] Global sync failed:", err);
      }
    })();
  }, [isSignedIn, clerkUser?.id]);

  return null;
}

export default function App() {
  return (
    <>
      <GlobalSync />
      <Routes>
        <Route path="/login" element={<AdminAuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </>
  );
}
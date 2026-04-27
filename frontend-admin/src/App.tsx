import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminAuthPage from "./pages/auth/AdminAuthPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import ApprovalsPage from "./pages/approvals/ApprovalsPage";
import UsersPage from "./pages/users/UsersPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminAuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}
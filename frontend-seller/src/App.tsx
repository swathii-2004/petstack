import { Routes, Route, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

import SellerLayout from "./components/layout/SellerLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<SellerLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<div className="p-10"><h2 className="text-xl">Orders (Phase 4)</h2></div>} />
          <Route path="/payouts" element={<div className="p-10"><h2 className="text-xl">Payouts (Phase 4)</h2></div>} />
        </Route>
      </Route>
    </Routes>
  );
}
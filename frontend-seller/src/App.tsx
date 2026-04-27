import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import SellerAuthPage from "./pages/auth/SellerAuthPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import OrdersPage from "./pages/Orders";
import PayoutsPage from "./pages/Payouts";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SellerAuthPage />} />
      <Route path="/signup" element={<SellerAuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/payouts" element={<PayoutsPage />} />
      </Route>
    </Routes>
  );
}
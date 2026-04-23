import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

import CartDrawer from "./components/cart/CartDrawer";
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage showSignupLink={true} />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ShopPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          {/* Phase 4 routes */}
          <Route path="/checkout" element={<div className="p-20">Checkout (Phase 4)</div>} />
        </Route>
      </Routes>
      <CartDrawer />
    </>
  );
}
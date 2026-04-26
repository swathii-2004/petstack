import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

import CartDrawer from "./components/cart/CartDrawer";
import Navbar from "./components/Navbar";
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";
import CheckoutPage from "./pages/shop/Checkout";
import CheckoutSuccessPage from "./pages/shop/CheckoutSuccess";
import OrdersPage from "./pages/shop/Orders";
import MyPetsPage from "./pages/pets/MyPetsPage";
import VetDiscoveryPage from "./pages/vets/VetDiscoveryPage";
import BookAppointmentPage from "./pages/vets/BookAppointmentPage";
import UserAppointmentsPage from "./pages/vets/UserAppointmentsPage";

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
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          {/* Phase 5 routes */}
          <Route path="/pets" element={<MyPetsPage />} />
          <Route path="/vets" element={<VetDiscoveryPage />} />
          <Route path="/vets/:vetId/book" element={<BookAppointmentPage />} />
          <Route path="/appointments" element={<UserAppointmentsPage />} />
        </Route>
      </Routes>
      <CartDrawer />
    </>
  );
}
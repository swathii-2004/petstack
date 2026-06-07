import { Routes, Route } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/auth/AuthPage";

import CartDrawer from "./components/cart/CartDrawer";
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";
import CheckoutPage from "./pages/shop/Checkout";
import CheckoutSuccessPage from "./pages/shop/CheckoutSuccess";
import OrdersPage from "./pages/shop/Orders";
import MyPetsPage from "./pages/pets/MyPetsPage";
import VetDiscoveryPage from "./pages/vets/VetDiscoveryPage";
import BookAppointmentPage from "./pages/vets/BookAppointmentPage";
import UserAppointmentsPage from "./pages/vets/UserAppointmentsPage";
import ChatPage from "./pages/chat/ChatPage";
import UserDashboardPage from "./pages/dashboard/UserDashboardPage";

export default function App() {
  return (
    <>
      <Routes>
        {/* Clerk SSO callback — REQUIRED for Google OAuth to work */}
        <Route
          path="/sso-callback"
          element={<AuthenticateWithRedirectCallback />}
        />

        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<UserDashboardPage />} />
          <Route path="/products" element={<ShopPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/pets" element={<MyPetsPage />} />
          <Route path="/vets" element={<VetDiscoveryPage />} />
          <Route path="/vets/:vetId/book" element={<BookAppointmentPage />} />
          <Route path="/appointments" element={<UserAppointmentsPage />} />
          <Route path="/chat/:appointmentId" element={<ChatPage />} />
        </Route>
      </Routes>
      <CartDrawer />
    </>
  );
}
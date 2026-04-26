import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VetAppointmentsPage from "./pages/appointments/VetAppointmentsPage";
import AvailabilityPage from "./pages/availability/AvailabilityPage";
import ChatPage from "./pages/chat/ChatPage";
import VetDashboardPage from "./pages/dashboard/VetDashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<VetDashboardPage />} />
        <Route path="/appointments" element={<VetAppointmentsPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/chat/:appointmentId" element={<ChatPage />} />
      </Route>
    </Routes>
  );
}
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VetAppointmentsPage from "./pages/appointments/VetAppointmentsPage";
import AvailabilityPage from "./pages/availability/AvailabilityPage";
import ChatPage from "./pages/chat/ChatPage";

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Vet Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <a href="/appointments" className="block bg-white border rounded-lg p-5 hover:shadow-md transition">
          <p className="text-2xl mb-1">📅</p>
          <p className="font-semibold">Appointments</p>
          <p className="text-sm text-gray-500">Manage your bookings</p>
        </a>
        <a href="/availability" className="block bg-white border rounded-lg p-5 hover:shadow-md transition">
          <p className="text-2xl mb-1">🗓️</p>
          <p className="font-semibold">Availability</p>
          <p className="text-sm text-gray-500">Set your schedule</p>
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/appointments" element={<VetAppointmentsPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/chat/:appointmentId" element={<ChatPage />} />
      </Route>
    </Routes>
  );
}
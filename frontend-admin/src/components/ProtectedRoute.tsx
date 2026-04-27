import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import AdminSidebar from "./AdminSidebar";
import { ShieldOff } from "lucide-react";

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only "admin" role can access
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-ad-bg flex items-center justify-center">
        <div className="bg-ad-card rounded-2xl shadow-xl p-10 max-w-md text-center border border-ad-danger/30">
          <div className="w-14 h-14 bg-ad-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-ad-danger/20">
            <ShieldOff size={28} className="text-ad-danger" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-ad-text-dim text-sm mb-6">
            Your account (<strong>{user?.role}</strong>) does not have root privileges to access the Command Center.
          </p>
          <a
            href="/login"
            className="inline-block bg-ad-accent text-black px-6 py-2.5 rounded-xl font-bold hover:bg-ad-accent/90 text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ad-bg selection:bg-ad-accent/30 selection:text-ad-accent">
      <AdminSidebar />
      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
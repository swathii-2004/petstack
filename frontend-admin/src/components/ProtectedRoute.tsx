import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only "admin" role can access the admin app
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md text-center">
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account (<strong>{user?.role}</strong>) does not have access to the Admin Portal.
          </p>
          <a
            href="/login"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 text-sm"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useAuthStore } from "../store/authStore";
import VetSidebar from "./VetSidebar";
import { ShieldOff } from "lucide-react";

export default function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  const backendUser = useAuthStore((s) => s.user);

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-vt-bg">
      <div className="animate-spin w-8 h-8 border-4 border-vt-teal border-t-transparent rounded-full" />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (!backendUser) return (
    <div className="min-h-screen flex items-center justify-center bg-vt-bg">
      <div className="animate-spin w-8 h-8 border-4 border-vt-teal border-t-transparent rounded-full" />
    </div>
  );

  // Status-based redirect for vet flow
  if (backendUser && backendUser.role === "vet") {
    if ((backendUser as any).status === "pending") {
      const hasDocs = (backendUser as any).doc_urls?.length > 0;
      return <Navigate to={hasDocs ? "/pending-approval" : "/upload-documents"} replace />;
    }
    if ((backendUser as any).status === "rejected") return <Navigate to="/declined" replace />;
  }

  if (backendUser && backendUser.role !== "vet") {
    return (
      <div className="min-h-screen bg-vt-bg flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md text-center border border-vt-border">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-vt-text-dark mb-2">Access Denied</h2>
          <p className="text-vt-text-mid text-sm mb-6">Your account (<strong>{backendUser?.role}</strong>) does not have access to the Vet Portal.</p>
          <a href="/login" className="inline-block bg-vt-teal text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-vt-teal-dark text-sm transition-colors">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-vt-bg">
      <VetSidebar />
      <main className="flex-1 ml-60 p-8 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
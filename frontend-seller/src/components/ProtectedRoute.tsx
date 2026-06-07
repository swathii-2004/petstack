import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useAuthStore } from "../store/authStore";
import SellerSidebar from "./SellerSidebar";
import { ShieldOff } from "lucide-react";

export default function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  const backendUser = useAuthStore((s) => s.user);

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-sl-bg">
      <div className="animate-spin w-8 h-8 border-4 border-sl-indigo border-t-transparent rounded-full" />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (!backendUser) return (
    <div className="min-h-screen flex items-center justify-center bg-sl-bg">
      <div className="animate-spin w-8 h-8 border-4 border-sl-indigo border-t-transparent rounded-full" />
    </div>
  );

  // Status-based redirect for seller flow
  if (backendUser && backendUser.role === "seller") {
    if ((backendUser as any).status === "pending") {
      const hasDocs = (backendUser as any).doc_urls?.length > 0;
      return <Navigate to={hasDocs ? "/pending-approval" : "/upload-documents"} replace />;
    }
    if ((backendUser as any).status === "rejected") return <Navigate to="/declined" replace />;
  }

  // Only "seller" role can access the seller app
  if (backendUser && backendUser.role !== "seller") {
    return (
      <div className="min-h-screen bg-sl-bg flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md text-center border border-sl-border">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-sl-text-dark mb-2">Access Denied</h2>
          <p className="text-sl-text-mid text-sm mb-6">
            Your account (<strong>{backendUser?.role}</strong>) does not have access to the Seller Portal.
          </p>
          <a href="/login" className="inline-block bg-sl-indigo text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-sl-indigo-dk text-sm transition-colors">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-sl-bg">
      <SellerSidebar />
      <main className="flex-1 ml-60 p-8 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
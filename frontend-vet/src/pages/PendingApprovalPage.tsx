import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(async () => {
      try {
        const token = await getToken();
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await api.get("/auth/me");
        setUser(res.data);
        if (res.data.status === "active") navigate("/", { replace: true });
        else if (res.data.status === "rejected") navigate("/declined", { replace: true });
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  const checkNow = async () => {
    setChecking(true);
    try {
      const token = await getToken();
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const res = await api.get("/auth/me");
      setUser(res.data);
      if (res.data.status === "active") navigate("/", { replace: true });
      else if (res.data.status === "rejected") navigate("/declined", { replace: true });
    } catch {} finally { setChecking(false); }
  };

  const handleLogout = async () => { clearAuth(); await signOut(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg text-center">
        <div className="w-24 h-24 bg-vt-teal/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border-4 border-vt-teal/20 animate-ping" />
          <Clock className="text-vt-teal" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-vt-text-dark tracking-tight mb-3">Application Under Review</h1>
        <p className="text-vt-text-mid text-[14.5px] mb-8 leading-relaxed max-w-md mx-auto">
          Your veterinary application has been submitted. Our team reviews all applications within <strong>24–48 hours</strong>.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-vt-teal/10 rounded-xl flex items-center justify-center"><span className="text-xl"></span></div>
            <div>
              <p className="text-[13px] font-bold text-vt-text-dark">Application Status</p>
              <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-0.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />Pending Review
              </span>
            </div>
          </div>
          {user && (
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-vt-text-mid">Name</span><span className="font-semibold text-vt-text-dark">{user.full_name}</span></div>
              <div className="flex justify-between"><span className="text-vt-text-mid">Email</span><span className="font-semibold text-vt-text-dark">{user.email}</span></div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={checkNow} disabled={checking} className="flex-1 flex items-center justify-center gap-2 py-3 bg-vt-teal text-white rounded-xl font-semibold text-[14px] hover:bg-vt-teal-dark transition-colors disabled:opacity-60">
            <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking..." : "Check Status"}
          </button>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold text-[14px] hover:bg-gray-50 transition-colors">
            <LogOut size={16} />Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

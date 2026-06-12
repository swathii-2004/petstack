import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { XCircle, RefreshCw, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function DeclinedPage() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  const handleResubmit = () => navigate("/upload-documents", { replace: true });

  const handleLogout = async () => {
    clearAuth();
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-red-500" size={48} />
        </div>

        <h1 className="text-3xl font-bold text-sl-text-dark tracking-tight mb-3">
          Application Declined
        </h1>
        <p className="text-sl-text-mid text-[14.5px] mb-8 leading-relaxed max-w-md mx-auto">
          Unfortunately, your seller application was not approved at this time. You can update your information and re-submit for review.
        </p>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-lg p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <span className="text-xl"></span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-sl-text-dark">Application Status</p>
              <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-0.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                Declined
              </span>
            </div>
          </div>
          {user && (
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-sl-text-mid">Name</span><span className="font-semibold text-sl-text-dark">{user.full_name}</span></div>
              <div className="flex justify-between"><span className="text-sl-text-mid">Email</span><span className="font-semibold text-sl-text-dark">{user.email}</span></div>
            </div>
          )}
          <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-[12px] text-red-700 font-medium">Common reasons for rejection:</p>
            <ul className="text-[11.5px] text-red-600 mt-1 space-y-1 list-disc list-inside">
              <li>Incomplete or unreadable documents</li>
              <li>Invalid GST number</li>
              <li>Business information mismatch</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleResubmit}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-sl-indigo text-white rounded-xl font-semibold text-[14px] hover:bg-sl-indigo-dk transition-colors"
          >
            <RefreshCw size={16} />
            Re-submit Application
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-500 rounded-xl font-semibold text-[14px] hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

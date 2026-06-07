import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";

const inputCls = "w-full h-11 px-4 border border-sl-border rounded-xl text-sm text-sl-text-dark bg-white outline-none transition-all focus:border-sl-indigo focus:ring-4 focus:ring-sl-indigo/15 placeholder:text-sl-text-mid/60";
const labelCls = "block text-[12.5px] font-semibold text-sl-text-mid mb-1.5 uppercase tracking-wide";

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const [businessName, setBusinessName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !gstNumber) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append("business_name", businessName);
      fd.append("gst_number", gstNumber);
      if (phone) fd.append("phone", phone);
      files.forEach(f => fd.append("documents", f));

      await api.patch("/auth/users/me/seller-documents", fd);
      toast.success("Documents submitted! Awaiting admin approval.");
      navigate("/pending-approval", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sl-indigo rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_8px_30px_rgba(49,46,129,0.3)]">
            <FileText className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-sl-text-dark tracking-tight mb-2">Business Registration</h1>
          <p className="text-sl-text-mid text-[14px] max-w-md mx-auto">
            Complete your seller profile by providing business details and uploading verification documents.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Sign In", "Business Details", "Pending Review"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-green-500 text-white" : i === 1 ? "bg-sl-indigo text-white" : "bg-gray-200 text-gray-400"}`}>
                {i === 0 ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-[12px] font-medium ${i === 1 ? "text-sl-indigo" : "text-gray-400"}`}>{step}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Business Name *</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Global Pets Inc." className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>GST Number *</label>
                <input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="27AAPFU0939F1ZV" className={inputCls} required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className={inputCls} />
            </div>

            {/* File Upload */}
            <div>
              <label className={labelCls}>Business Documents</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-sl-indigo/30 rounded-2xl p-6 text-center cursor-pointer hover:border-sl-indigo/60 hover:bg-sl-indigo/5 transition-all"
              >
                <Upload className="mx-auto text-sl-indigo/40 mb-2" size={28} />
                <p className="text-[13px] font-semibold text-sl-text-mid">Click to upload documents</p>
                <p className="text-[11px] text-sl-text-mid/60 mt-1">PDF, JPG, PNG up to 10MB each</p>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFiles} className="hidden" />
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 bg-sl-indigo/5 border border-sl-indigo/20 rounded-xl px-3 py-2.5">
                      <FileText size={16} className="text-sl-indigo flex-shrink-0" />
                      <span className="text-[12px] text-sl-text-dark flex-1 truncate">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
              <span className="text-base mt-0.5">📋</span>
              <p className="text-[11.5px] text-amber-800 leading-snug">
                Required: Business registration certificate, GST certificate, and any government-issued ID.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-sl-indigo text-white rounded-xl font-semibold text-[15px] hover:bg-sl-indigo-dk transition-colors shadow-[0_4px_18px_rgba(49,46,129,0.3)] disabled:opacity-60 mt-2"
            >
              {loading ? "Submitting..." : "Submit Application →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

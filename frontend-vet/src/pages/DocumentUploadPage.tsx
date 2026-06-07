import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import api from "../api/axios";

const inputCls = "w-full h-11 px-4 border border-vt-border rounded-xl text-sm text-vt-text-dark bg-vt-bg outline-none transition-all focus:border-vt-teal focus:ring-4 focus:ring-vt-teal/15 placeholder:text-vt-text-mid/60";
const labelCls = "block text-[12.5px] font-semibold text-vt-text-mid mb-1.5 uppercase tracking-wide";

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [phone, setPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNumber || !specialisation || !clinicName || !experienceYears) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append("license_number", licenseNumber);
      fd.append("specialisation", specialisation);
      fd.append("clinic_name", clinicName);
      fd.append("experience_years", experienceYears);
      if (phone) fd.append("phone", phone);
      files.forEach(f => fd.append("documents", f));

      await api.patch("/auth/users/me/vet-documents", fd);
      toast.success("Documents submitted! Awaiting admin approval.");
      navigate("/pending-approval", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-vt-teal rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_8px_30px_rgba(26,95,122,0.3)]">
            <FileText className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-vt-text-dark tracking-tight mb-2">Veterinary Registration</h1>
          <p className="text-vt-text-mid text-[14px] max-w-md mx-auto">
            Provide your professional credentials and upload verification documents to complete your registration.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {["Sign In", "Professional Details", "Pending Review"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-green-500 text-white" : i === 1 ? "bg-vt-teal text-white" : "bg-gray-200 text-gray-400"}`}>
                {i === 0 ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-[12px] font-medium ${i === 1 ? "text-vt-teal" : "text-gray-400"}`}>{step}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>License Number *</label>
                <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="VET-12345" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Specialisation *</label>
                <input value={specialisation} onChange={e => setSpecialisation(e.target.value)} placeholder="Small Animals" className={inputCls} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Clinic Name *</label>
                <input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="PawCare Clinic" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Experience (Years) *</label>
                <input value={experienceYears} onChange={e => setExperienceYears(e.target.value)} type="number" min="0" placeholder="5" className={inputCls} required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>License Documents</label>
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-vt-teal/30 rounded-2xl p-6 text-center cursor-pointer hover:border-vt-teal/60 hover:bg-vt-teal/5 transition-all">
                <Upload className="mx-auto text-vt-teal/40 mb-2" size={28} />
                <p className="text-[13px] font-semibold text-vt-text-mid">Click to upload license documents</p>
                <p className="text-[11px] text-vt-text-mid/60 mt-1">PDF, JPG, PNG up to 10MB each</p>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFiles} className="hidden" />
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 bg-vt-teal/5 border border-vt-teal/20 rounded-xl px-3 py-2.5">
                      <FileText size={16} className="text-vt-teal flex-shrink-0" />
                      <span className="text-[12px] text-vt-text-dark flex-1 truncate">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 bg-vt-mint/15 border border-vt-mint/40 rounded-xl px-3.5 py-2.5">
              <span className="text-base mt-0.5">📋</span>
              <p className="text-[11.5px] text-vt-teal leading-snug">Required: Veterinary license certificate and any government-issued professional ID.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 bg-vt-teal text-white rounded-xl font-semibold text-[15px] hover:bg-vt-teal-dark transition-colors shadow-[0_4px_18px_rgba(26,95,122,0.3)] disabled:opacity-60">
              {loading ? "Submitting..." : "Submit Application →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

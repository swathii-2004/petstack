import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { ApiError, AuthResponse } from "../../types";
import { AxiosError } from "axios";

// ── Schemas ──────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  license_number: z.string().min(1, "License number required"),
  specialisation: z.string().min(1, "Specialisation required"),
  clinic_name: z.string().min(1, "Clinic name required"),
  experience_years: z.coerce.number().min(0, "Invalid experience"),
  documents: z.any(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

// ── Shared input class ────────────────────────────────────────────────────────
const inputCls =
  "w-full h-11 px-4 border border-vt-border rounded-xl text-sm text-vt-text-dark bg-vt-bg " +
  "outline-none transition-all focus:border-vt-teal focus:ring-4 focus:ring-vt-teal/15 " +
  "placeholder:text-vt-text-mid/60";
const errCls = "text-red-400 text-xs mt-1";
const labelCls = "block text-[12.5px] font-semibold text-vt-text-mid mb-1.5 uppercase tracking-wide";

// ── Left-panel features ───────────────────────────────────────────────────────
const features = [
  {
    icon: "🩺",
    title: "Patient Records",
    desc: "Access full histories, lab results & vaccination logs instantly.",
  },
  {
    icon: "📅",
    title: "Appointment Management",
    desc: "Smart scheduling with automated reminders and conflict detection.",
  },
  {
    icon: "💊",
    title: "Veterinary Pharmacy",
    desc: "Order & track medications from trusted veterinary suppliers.",
  },
  {
    icon: "🔬",
    title: "Diagnostics & Reports",
    desc: "Receive and analyse lab results from integrated external labs.",
  },
];

// ── High-quality Unsplash vet images ─────────────────────────────────────────
const images = [
  {
    src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80&fit=crop",
    label: "Veterinary Care",
  },
  {
    src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80&fit=crop",
    label: "Patient Check-up",
  },
  {
    src: "https://images.unsplash.com/photo-1581888227599-779811939961?w=600&q=80&fit=crop",
    label: "Lab Diagnostics",
  },
  {
    src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&fit=crop",
    label: "Animal Wellness",
  },
];

// ── Eye icon component ────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      {open ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VetAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore(s => s.setAuth);

  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname === "/login");
  }, [location.pathname]);

  const lf = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const sf = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  // ── Login handler ──────────────────────────────────────────────────────────
  const onLogin = async (d: LoginForm) => {
    try {
      const fd = new URLSearchParams();
      fd.append("username", d.email);
      fd.append("password", d.password);
      const r = await api.post<AuthResponse>("/auth/login", fd, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setAuth(r.data.user, r.data.access_token);
      toast.success("Welcome back, Doctor!");
      navigate("/");
    } catch (e) {
      toast.error((e as AxiosError<ApiError>).response?.data?.detail || "Login failed");
    }
  };

  // ── Signup handler ─────────────────────────────────────────────────────────
  const onSignup = async (d: SignupForm) => {
    try {
      const fd = new FormData();
      fd.append("full_name", d.full_name);
      fd.append("email", d.email);
      fd.append("password", d.password);
      fd.append("role", "vet");
      fd.append("license_number", d.license_number);
      fd.append("specialisation", d.specialisation);
      fd.append("clinic_name", d.clinic_name);
      fd.append("experience_years", d.experience_years.toString());
      if (d.documents && d.documents.length > 0) {
        for (let i = 0; i < d.documents.length; i++) {
          fd.append("documents", d.documents[i]);
        }
      }
      await api.post("/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Application submitted — awaiting admin approval.");
      navigate("/login");
    } catch (e) {
      toast.error((e as AxiosError<ApiError>).response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden">

      {/* ══ LEFT — Deep Teal panel ══ */}
      <div className="w-[52%] flex-shrink-0 bg-vt-teal flex flex-col justify-center px-12 py-10 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-vt-mint/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-6 text-8xl opacity-5 rotate-12 select-none pointer-events-none">🩺</div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-vt-orange rounded-xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(255,159,67,0.45)]">
              🐾
            </div>
            <div>
              <span className="font-serif text-2xl font-semibold text-white">
                Pet<span className="text-vt-orange">Stack</span>
              </span>
              <p className="text-white/40 text-[10px] uppercase tracking-widest leading-none">
                Professional
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="font-serif text-[clamp(22px,2.2vw,34px)] text-white font-semibold leading-snug mb-3">
            {isLogin
              ? <>"Streamlined care,<br />exceptional outcomes."</>
              : <>"Join a network of<br />trusted veterinarians."</>
            }
          </div>
          <p className="text-white/50 text-[13.5px] leading-relaxed mb-7 max-w-sm">
            The complete professional platform for veterinary practice management — patient records, scheduling, diagnostics, and more.
          </p>

          {/* Stats */}
          <div className="flex gap-7 mb-8">
            {[["500+", "Vets"], ["12k+", "Patients"], ["4.9★", "Rating"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-vt-orange font-bold text-lg leading-none">{val}</p>
                <p className="text-white/40 text-[11px] mt-1">{lbl}</p>
              </div>
            ))}
          </div>

          {/* Image grid */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
            {images.map(({ src, label }) => (
              <div key={label} className="relative rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] group">
                <img
                  src={src}
                  alt={label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-vt-teal-dark/70 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-semibold tracking-wide">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Feature strip */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.title} className="flex items-start gap-2.5 bg-white/8 rounded-xl px-3 py-2.5">
                <span className="text-lg leading-none mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white text-[12px] font-semibold leading-tight">{f.title}</p>
                  <p className="text-white/40 text-[10.5px] leading-snug mt-0.5 line-clamp-2">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Cool-white form panel ══ */}
      <div className="flex-1 bg-vt-bg flex items-center justify-center px-10 overflow-y-auto">
        <div className="w-full max-w-[400px] py-8">

          {/* Tab toggle */}
          <div className="flex bg-vt-teal/10 p-1 rounded-xl mb-7 gap-1">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${
                isLogin
                  ? "bg-vt-teal text-white shadow"
                  : "text-vt-text-mid hover:text-vt-teal"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${
                !isLogin
                  ? "bg-vt-teal text-white shadow"
                  : "text-vt-text-mid hover:text-vt-teal"
              }`}
            >
              Register
            </button>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-vt-mint/25 border border-vt-mint/50 text-vt-teal text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-vt-mint animate-pulse" />
            {isLogin ? "Vet Professional Portal" : "Apply for Access"}
          </div>

          <h2 className="font-serif text-[28px] font-semibold text-vt-text-dark mb-1">
            {isLogin ? "Welcome back, Doctor" : "Vet Registration"}
          </h2>
          <p className="text-[13px] text-vt-text-mid mb-6 leading-relaxed">
            {isLogin
              ? <span>No account? <span onClick={() => navigate("/signup")} className="text-vt-teal font-semibold cursor-pointer hover:underline">Apply for access →</span></span>
              : <span>Already registered? <span onClick={() => navigate("/login")} className="text-vt-teal font-semibold cursor-pointer hover:underline">Sign in →</span></span>
            }
          </p>

          {/* ── LOGIN FORM ── */}
          {isLogin ? (
            <form onSubmit={lf.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className={labelCls}>Email address</label>
                <input {...lf.register("email")} type="email" placeholder="dr.you@clinic.com" className={inputCls} />
                {lf.formState.errors.email && <p className={errCls}>{lf.formState.errors.email.message}</p>}
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className={labelCls}>Password</label>
                  <span
                    className="text-[11.5px] text-vt-teal font-medium cursor-pointer hover:underline"
                    onClick={() => toast.info("Reset link sent if account exists")}
                  >
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <input
                    {...lf.register("password")}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vt-text-mid hover:text-vt-teal"
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {lf.formState.errors.password && <p className={errCls}>{lf.formState.errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={lf.formState.isSubmitting}
                className="w-full py-3.5 bg-vt-teal text-white rounded-xl font-semibold text-[15px] hover:bg-vt-teal-dark transition-colors shadow-[0_4px_18px_rgba(26,95,122,0.35)] disabled:opacity-60 mt-2"
              >
                {lf.formState.isSubmitting ? "Signing in..." : "Login →"}
              </button>
            </form>

          ) : (
            /* ── REGISTRATION FORM ── */
            <form onSubmit={sf.handleSubmit(onSignup)} className="space-y-3">
              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input {...sf.register("full_name")} type="text" placeholder="Dr. Jane Smith" className={inputCls} />
                  {sf.formState.errors.full_name && <p className={errCls}>{sf.formState.errors.full_name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input {...sf.register("email")} type="email" placeholder="dr@clinic.com" className={inputCls} />
                  {sf.formState.errors.email && <p className={errCls}>{sf.formState.errors.email.message}</p>}
                </div>
              </div>

              {/* Row 2: Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <input {...sf.register("password")} type={showPw ? "text" : "password"} placeholder="Min 8 chars" className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-vt-text-mid hover:text-vt-teal">
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  {sf.formState.errors.password && <p className={errCls}>{sf.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input {...sf.register("confirmPassword")} type="password" placeholder="••••••••" className={inputCls} />
                  {sf.formState.errors.confirmPassword && <p className={errCls}>{sf.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>

              {/* Row 3: License + Specialisation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>License No.</label>
                  <input {...sf.register("license_number")} placeholder="VET-12345" className={inputCls} />
                  {sf.formState.errors.license_number && <p className={errCls}>{sf.formState.errors.license_number.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Specialisation</label>
                  <input {...sf.register("specialisation")} placeholder="Small Animals" className={inputCls} />
                  {sf.formState.errors.specialisation && <p className={errCls}>{sf.formState.errors.specialisation.message}</p>}
                </div>
              </div>

              {/* Row 4: Clinic + Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Clinic Name</label>
                  <input {...sf.register("clinic_name")} placeholder="PawCare Clinic" className={inputCls} />
                  {sf.formState.errors.clinic_name && <p className={errCls}>{sf.formState.errors.clinic_name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Experience (yrs)</label>
                  <input {...sf.register("experience_years")} type="number" min="0" placeholder="5" className={inputCls} />
                  {sf.formState.errors.experience_years && <p className={errCls}>{sf.formState.errors.experience_years.message}</p>}
                </div>
              </div>

              {/* Documents */}
              <div>
                <label className={labelCls}>Documents (PDF / JPG / PNG, max 5 MB each)</label>
                <input
                  {...sf.register("documents")}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-[12.5px] text-vt-text-mid border border-vt-border rounded-xl px-3 py-2.5 bg-vt-bg file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-vt-mint/30 file:text-vt-teal hover:file:bg-vt-mint/50 cursor-pointer transition-colors"
                />
              </div>

              {/* Note */}
              <div className="flex items-start gap-2 bg-vt-mint/15 border border-vt-mint/40 rounded-xl px-3.5 py-2.5">
                <span className="text-vt-mint text-base mt-0.5">ℹ️</span>
                <p className="text-[11.5px] text-vt-teal leading-snug">
                  Your application will be reviewed by an admin before you can access the portal. You'll be notified by email.
                </p>
              </div>

              <button
                type="submit"
                disabled={sf.formState.isSubmitting}
                className="w-full py-3.5 bg-vt-orange text-white rounded-xl font-semibold text-[15px] hover:bg-vt-orange-dk transition-colors shadow-[0_4px_18px_rgba(255,159,67,0.40)] disabled:opacity-60"
              >
                {sf.formState.isSubmitting ? "Submitting..." : "Submit Application →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

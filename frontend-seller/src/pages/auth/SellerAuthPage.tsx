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
  business_name: z.string().min(1, "Business name required"),
  business_address: z.string().min(1, "Business address required"),
  tax_id: z.string().min(1, "Tax ID required"),
  phone_number: z.string().min(1, "Phone number required"),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

// ── Shared input class ────────────────────────────────────────────────────────
const inputCls =
  "w-full h-11 px-4 border border-sl-border rounded-xl text-sm text-sl-text-dark bg-sl-bg " +
  "outline-none transition-all focus:border-sl-indigo focus:ring-4 focus:ring-sl-indigo/15 " +
  "placeholder:text-sl-text-mid/60";
const errCls = "text-red-400 text-xs mt-1";
const labelCls = "block text-[12.5px] font-semibold text-sl-text-mid mb-1.5 uppercase tracking-wide";

// ── Left-panel features ───────────────────────────────────────────────────────
const features = [
  {
    title: "Global Reach",
    desc: "Expand your business and sell pet products to customers nationwide.",
  },
  {
    title: "Analytics Dashboard",
    desc: "Track sales, revenue, and product performance in real time.",
  },
  {
    title: "Fast Payouts",
    desc: "Get your earnings transferred directly to your bank account seamlessly.",
  },
  {
    title: "Inventory Management",
    desc: "Easily upload products, update stock levels, and fulfill orders.",
  },
];

// ── High-quality Unsplash pet/e-commerce images ────────────────────────────
const images = [
  {
    src: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80&fit=crop",
    label: "Sales & Analytics",
  },
  {
    src: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&q=80&fit=crop",
    label: "Inventory Logistics",
  },
  {
    src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80&fit=crop",
    label: "Business Growth",
  },
  {
    src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80&fit=crop",
    label: "E-Commerce Fulfillment",
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
export default function SellerAuthPage() {
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
      toast.success("Welcome back to Seller Portal!");
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
      fd.append("role", "seller");
      fd.append("business_name", d.business_name);
      fd.append("gst_number", d.tax_id);
      fd.append("phone", d.phone_number);
      // Backend does not currently store business_address directly, but we collect it in the form.

      await api.post("/auth/signup", fd);
      toast.success("Seller account registered. Awaiting admin approval.");
      navigate("/login");
    } catch (e) {
      toast.error((e as AxiosError<ApiError>).response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden">

      {/* ══ LEFT — Deep Indigo panel ══ */}
      <div className="w-[52%] flex-shrink-0 bg-sl-indigo flex flex-col justify-center px-12 py-10 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-sl-violet/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-sl-emerald rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(16,185,129,0.35)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
                <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight text-white">
                PetStack <span className="text-sl-emerald">Seller</span>
              </span>
              <p className="text-white/40 text-[10px] uppercase tracking-widest leading-none">
                Commerce Portal
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="text-[clamp(22px,2.2vw,34px)] text-white font-bold leading-snug mb-3 tracking-tight">
            {isLogin
              ? <>"Accelerate your business,<br />manage with ease."</>
              : <>"Start selling on the<br />premier pet platform."</>
            }
          </div>
          <p className="text-white/50 text-[13.5px] leading-relaxed mb-7 max-w-sm">
            The complete toolkit for your pet business — track inventory, monitor revenue analytics, and fulfill orders efficiently.
          </p>

          {/* Image grid */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
            {images.map(({ src, label }) => (
              <div key={label} className="relative rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] group">
                <img
                  src={src}
                  alt={label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sl-indigo-dk/80 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-semibold tracking-wide">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Feature strip */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.title} className="bg-white/8 rounded-xl px-3 py-2.5">
                <p className="text-white text-[12px] font-semibold leading-tight">{f.title}</p>
                <p className="text-white/40 text-[10.5px] leading-snug mt-0.5 line-clamp-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Cool Slate form panel ══ */}
      <div className="flex-1 bg-sl-bg flex items-center justify-center px-10 overflow-y-auto">
        <div className="w-full max-w-[400px] py-8">

          {/* Tab toggle */}
          <div className="flex bg-sl-indigo/10 p-1 rounded-xl mb-7 gap-1">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${
                isLogin
                  ? "bg-sl-indigo text-white shadow"
                  : "text-sl-text-mid hover:text-sl-indigo"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${
                !isLogin
                  ? "bg-sl-indigo text-white shadow"
                  : "text-sl-text-mid hover:text-sl-indigo"
              }`}
            >
              Register
            </button>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-sl-violet/15 border border-sl-violet/30 text-sl-indigo text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-sl-violet animate-pulse" />
            {isLogin ? "Seller Dashboard Access" : "Partner Application"}
          </div>

          <h2 className="text-[28px] font-bold text-sl-text-dark mb-1 tracking-tight">
            {isLogin ? "Welcome back" : "Become a Seller"}
          </h2>
          <p className="text-[13px] text-sl-text-mid mb-6 leading-relaxed">
            {isLogin
              ? <span>New partner? <span onClick={() => navigate("/signup")} className="text-sl-indigo font-semibold cursor-pointer hover:underline">Apply to sell →</span></span>
              : <span>Already a partner? <span onClick={() => navigate("/login")} className="text-sl-indigo font-semibold cursor-pointer hover:underline">Sign in →</span></span>
            }
          </p>

          {/* ── LOGIN FORM ── */}
          {isLogin ? (
            <form onSubmit={lf.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className={labelCls}>Email address</label>
                <input {...lf.register("email")} type="email" placeholder="you@business.com" className={inputCls} />
                {lf.formState.errors.email && <p className={errCls}>{lf.formState.errors.email.message}</p>}
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className={labelCls}>Password</label>
                  <span
                    className="text-[11.5px] text-sl-indigo font-medium cursor-pointer hover:underline"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sl-text-mid hover:text-sl-indigo"
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {lf.formState.errors.password && <p className={errCls}>{lf.formState.errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={lf.formState.isSubmitting}
                className="w-full py-3.5 bg-sl-indigo text-white rounded-xl font-semibold text-[15px] hover:bg-sl-indigo-dk transition-colors shadow-[0_4px_18px_rgba(49,46,129,0.35)] disabled:opacity-60 mt-2"
              >
                {lf.formState.isSubmitting ? "Signing in..." : "Login to Dashboard →"}
              </button>
            </form>

          ) : (
            /* ── REGISTRATION FORM ── */
            <form onSubmit={sf.handleSubmit(onSignup)} className="space-y-3">
              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input {...sf.register("full_name")} type="text" placeholder="John Doe" className={inputCls} />
                  {sf.formState.errors.full_name && <p className={errCls}>{sf.formState.errors.full_name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input {...sf.register("email")} type="email" placeholder="sales@store.com" className={inputCls} />
                  {sf.formState.errors.email && <p className={errCls}>{sf.formState.errors.email.message}</p>}
                </div>
              </div>

              {/* Row 2: Passwords */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <input {...sf.register("password")} type={showPw ? "text" : "password"} placeholder="Min 8 chars" className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sl-text-mid hover:text-sl-indigo">
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

              {/* Row 3: Business Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Business Name</label>
                  <input {...sf.register("business_name")} placeholder="Global Pets Inc." className={inputCls} />
                  {sf.formState.errors.business_name && <p className={errCls}>{sf.formState.errors.business_name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Tax ID / VAT</label>
                  <input {...sf.register("tax_id")} placeholder="TX-123456" className={inputCls} />
                  {sf.formState.errors.tax_id && <p className={errCls}>{sf.formState.errors.tax_id.message}</p>}
                </div>
              </div>

              {/* Row 4: Contact Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input {...sf.register("phone_number")} placeholder="+1 234 567 8900" className={inputCls} />
                  {sf.formState.errors.phone_number && <p className={errCls}>{sf.formState.errors.phone_number.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Business Address</label>
                  <input {...sf.register("business_address")} placeholder="123 Commerce St" className={inputCls} />
                  {sf.formState.errors.business_address && <p className={errCls}>{sf.formState.errors.business_address.message}</p>}
                </div>
              </div>

              {/* Note */}
              <div className="flex items-start gap-2 bg-sl-indigo/5 border border-sl-indigo/20 rounded-xl px-3.5 py-2.5 mt-2">
                <span className="text-sl-indigo text-base mt-0.5">ℹ️</span>
                <p className="text-[11.5px] text-sl-text-mid leading-snug">
                  Applications are manually reviewed to ensure marketplace quality. You will be notified via email once approved.
                </p>
              </div>

              <button
                type="submit"
                disabled={sf.formState.isSubmitting}
                className="w-full py-3.5 bg-sl-emerald text-white rounded-xl font-semibold text-[15px] hover:bg-emerald-600 transition-colors shadow-[0_4px_18px_rgba(16,185,129,0.35)] disabled:opacity-60"
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

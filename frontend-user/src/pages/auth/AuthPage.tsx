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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const signupSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

const inputCls = "w-full h-12 px-4 border border-white/20 rounded-xl text-sm text-ps-text-dark bg-white/90 outline-none transition-all focus:border-ps-gold focus:ring-4 focus:ring-ps-gold/20 placeholder:text-gray-400";
const errCls = "text-red-400 text-xs mt-1";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore(s => s.setAuth);
  const [isLogin, setIsLogin] = useState(location.pathname === "/login");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { setIsLogin(location.pathname === "/login"); }, [location.pathname]);

  const lf = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const sf = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onLogin = async (d: LoginForm) => {
    try {
      const fd = new URLSearchParams();
      fd.append("username", d.email); fd.append("password", d.password);
      const r = await api.post<AuthResponse>("/auth/login", fd, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      setAuth(r.data.user, r.data.access_token);
      toast.success("Welcome back!"); navigate("/");
    } catch (e) { toast.error((e as AxiosError<ApiError>).response?.data?.detail || "Login failed"); }
  };

  const onSignup = async (d: SignupForm) => {
    try {
      const fd = new FormData();
      fd.append("full_name", d.full_name); fd.append("email", d.email);
      fd.append("password", d.password); fd.append("role", "user");
      const r = await api.post<AuthResponse>("/auth/signup", fd);
      setAuth(r.data.user, r.data.access_token);
      toast.success("Account created!"); navigate("/");
    } catch (e) { toast.error((e as AxiosError<ApiError>).response?.data?.detail || "Registration failed"); }
  };

  const EyeIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      {showPw
        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );

  const images = [
    { src: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=80&fit=crop", label: "Vet Appointments" },
    { src: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80&fit=crop", label: "Pet Grooming" },
    { src: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80&fit=crop", label: "Food & Nutrition" },
    { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&fit=crop", label: "Pet Accessories" },
  ];

  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden">

      {/* ══ LEFT — Dark green panel ══ */}
      <div className="w-[52%] flex-shrink-0 bg-ps-dark flex flex-col justify-center px-14 py-12 relative overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-ps-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-ps-green/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-4 text-8xl opacity-5 rotate-12 select-none pointer-events-none">🐾</div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-ps-gold rounded-xl flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(233,168,58,0.4)]">🐾</div>
            <span className="font-serif text-2xl font-semibold text-white">Pet<span className="text-ps-gold">Stack</span></span>
          </div>

          {/* Tagline */}
          <div className="font-serif text-[clamp(24px,2.4vw,36px)] text-white font-medium leading-snug mb-4">
            {isLogin
              ? <>"Your pet's happiness,<br/>our priority."</>
              : <>"Join our community of<br/>pet lovers today."</>
            }
          </div>
          <p className="text-white/50 text-[14px] leading-relaxed mb-8 max-w-sm">
            Book trusted vets, shop quality products, and manage your pet's health — all in one place.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mb-8">
            {[["500+", "Vets"], ["10k+", "Pet Owners"], ["4.9★", "Rating"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-ps-gold font-bold text-lg leading-none">{val}</p>
                <p className="text-white/40 text-[12px] mt-1">{lbl}</p>
              </div>
            ))}
          </div>

          {/* Image grid */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
            {images.map(({ src, label }) => (
              <div key={label} className="relative rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] group">
                <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Cream form panel ══ */}
      <div className="flex-1 bg-ps-cream flex items-center justify-center px-12 overflow-y-auto">
        <div className="w-full max-w-[380px] py-8">
          {/* Toggle */}
          <div className="flex bg-ps-darker/10 p-1 rounded-xl mb-7 gap-1">
            <button type="button" onClick={() => navigate("/login")}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${isLogin ? "bg-ps-dark text-white shadow" : "text-ps-text-mid hover:text-ps-dark"}`}>
              Sign In
            </button>
            <button type="button" onClick={() => navigate("/signup")}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-200 ${!isLogin ? "bg-ps-dark text-white shadow" : "text-ps-text-mid hover:text-ps-dark"}`}>
              Register
            </button>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-ps-gold/20 border border-ps-gold/40 text-amber-800 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-ps-gold animate-pulse" />
            {isLogin ? "Pet Owner Portal" : "Create Account"}
          </div>

          <h2 className="font-serif text-3xl font-semibold text-ps-text-dark mb-1">
            {isLogin ? "Welcome back!" : "Join PetStack"}
          </h2>
          <p className="text-[13.5px] text-ps-text-mid mb-6 leading-relaxed">
            {isLogin
              ? <span>No account? <span onClick={() => navigate("/signup")} className="text-ps-green font-semibold cursor-pointer hover:underline">Sign up free →</span></span>
              : <span>Have an account? <span onClick={() => navigate("/login")} className="text-ps-green font-semibold cursor-pointer hover:underline">Sign in →</span></span>
            }
          </p>

          {/* Forms */}
          {isLogin ? (
            <form onSubmit={lf.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-ps-text-dark mb-1.5">Email address</label>
                <input {...lf.register("email")} type="email" placeholder="you@example.com" className={inputCls} />
                {lf.formState.errors.email && <p className={errCls}>{lf.formState.errors.email.message}</p>}
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[13px] font-medium text-ps-text-dark">Password</label>
                  <span className="text-[12px] text-ps-green font-medium cursor-pointer hover:underline" onClick={() => toast.info("Reset link sent if account exists")}>Forgot?</span>
                </div>
                <div className="relative">
                  <input {...lf.register("password")} type={showPw ? "text" : "password"} placeholder="••••••••" className={`${inputCls} pr-11`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ps-dark"><EyeIcon /></button>
                </div>
                {lf.formState.errors.password && <p className={errCls}>{lf.formState.errors.password.message}</p>}
              </div>
              <button type="submit" disabled={lf.formState.isSubmitting}
                className="w-full py-3.5 bg-ps-dark text-white rounded-xl font-semibold text-[15px] hover:bg-ps-darker transition-colors shadow-[0_4px_18px_rgba(27,46,34,0.3)] disabled:opacity-60">
                {lf.formState.isSubmitting ? "Signing in..." : "Login →"}
              </button>
            </form>
          ) : (
            <form onSubmit={sf.handleSubmit(onSignup)} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-ps-text-dark mb-1.5">Full Name</label>
                <input {...sf.register("full_name")} type="text" placeholder="John Doe" className={inputCls} />
                {sf.formState.errors.full_name && <p className={errCls}>{sf.formState.errors.full_name.message}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ps-text-dark mb-1.5">Email address</label>
                <input {...sf.register("email")} type="email" placeholder="you@example.com" className={inputCls} />
                {sf.formState.errors.email && <p className={errCls}>{sf.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ps-text-dark mb-1.5">Password</label>
                <div className="relative">
                  <input {...sf.register("password")} type={showPw ? "text" : "password"} placeholder="••••••••" className={`${inputCls} pr-11`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ps-dark"><EyeIcon /></button>
                </div>
                {sf.formState.errors.password && <p className={errCls}>{sf.formState.errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ps-text-dark mb-1.5">Confirm Password</label>
                <input {...sf.register("confirmPassword")} type="password" placeholder="••••••••" className={inputCls} />
                {sf.formState.errors.confirmPassword && <p className={errCls}>{sf.formState.errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={sf.formState.isSubmitting}
                className="w-full py-3.5 bg-ps-dark text-white rounded-xl font-semibold text-[15px] hover:bg-ps-darker transition-colors shadow-[0_4px_18px_rgba(27,46,34,0.3)] disabled:opacity-60">
                {sf.formState.isSubmitting ? "Creating account..." : "Create Account →"}
              </button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}

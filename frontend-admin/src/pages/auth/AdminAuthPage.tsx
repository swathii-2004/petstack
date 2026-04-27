import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { ShieldAlert, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [showPw, setShowPw] = useState(false);

  const lf = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onLogin = async (d: LoginForm) => {
    try {
      const fd = new URLSearchParams();
      fd.append("username", d.email);
      fd.append("password", d.password);
      const r = await api.post("/auth/login", fd, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setAuth(r.data.user, r.data.access_token);
      toast.success("Authentication successful. Welcome to Command Center.");
      navigate("/");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden bg-ad-bg selection:bg-ad-accent/30 selection:text-ad-accent">
      
      {/* ══ LEFT — Obsidian branding panel ══ */}
      <div className="w-[55%] flex-shrink-0 bg-[#000000] flex flex-col justify-center px-16 relative overflow-hidden border-r border-white/5">
        
        {/* Neon glowing orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-ad-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-ad-neon/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-screen"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ad-accent/10 border border-ad-accent/20 text-ad-accent text-[11px] font-mono font-semibold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-ad-accent animate-pulse" />
            System Secure
          </div>

          <h1 className="text-5xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
            PetStack <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ad-accent to-ad-neon">Command Center</span>
          </h1>
          <p className="text-ad-text-dim text-[15px] leading-relaxed max-w-md font-mono mb-12">
            > Initializing secure connection...<br/>
            > Verifying administrator credentials...<br/>
            > Awaiting authentication.<br/>
          </p>

          {/* Stats / Security info */}
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-ad-success mb-2" />
              <p className="text-white text-sm font-semibold">End-to-End Encrypted</p>
              <p className="text-ad-text-dim text-[11px] mt-1">All traffic is monitored & secured.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 text-ad-accent mb-2" />
              <p className="text-white text-sm font-semibold">Restricted Access</p>
              <p className="text-ad-text-dim text-[11px] mt-1">Authorized personnel only.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Login form ══ */}
      <div className="flex-1 bg-ad-card flex items-center justify-center relative">
        {/* Subtle grid on right too */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />

        <div className="w-full max-w-[380px] relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Admin Authentication</h2>
            <p className="text-ad-text-dim text-sm">Please enter your master credentials.</p>
          </div>

          <form onSubmit={lf.handleSubmit(onLogin)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-medium text-ad-text-dim mb-1.5 uppercase tracking-wider">
                Access ID (Email)
              </label>
              <input 
                {...lf.register("email")} 
                type="email" 
                placeholder="admin@petstack.com" 
                className="w-full h-12 px-4 bg-[#09090B] border border-ad-border rounded-xl text-sm text-white outline-none transition-all focus:border-ad-accent focus:ring-1 focus:ring-ad-accent placeholder:text-ad-text-dim/40 font-mono"
              />
              {lf.formState.errors.email && <p className="text-ad-danger text-xs mt-1.5">{lf.formState.errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-medium text-ad-text-dim uppercase tracking-wider">
                  Security Passkey
                </label>
              </div>
              <div className="relative">
                <input 
                  {...lf.register("password")} 
                  type={showPw ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="w-full h-12 px-4 pr-11 bg-[#09090B] border border-ad-border rounded-xl text-sm text-white outline-none transition-all focus:border-ad-accent focus:ring-1 focus:ring-ad-accent placeholder:text-ad-text-dim/40 font-mono tracking-widest"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(!showPw)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ad-text-dim hover:text-white text-[11px] font-mono font-semibold"
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
              {lf.formState.errors.password && <p className="text-ad-danger text-xs mt-1.5">{lf.formState.errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={lf.formState.isSubmitting}
              className="w-full h-12 mt-4 bg-white text-black hover:bg-ad-accent hover:text-white rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50"
            >
              {lf.formState.isSubmitting ? "AUTHENTICATING..." : "AUTHORIZE ACCESS →"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-ad-border pt-6">
            <p className="text-[10px] font-mono text-ad-text-dim/50 uppercase tracking-widest">
              Secured by PetStack Identity System v2.0.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

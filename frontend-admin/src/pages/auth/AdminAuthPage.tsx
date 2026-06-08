import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  // If already signed in via Clerk, go to dashboard directly
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ad-bg">
        <div className="animate-spin w-8 h-8 border-4 border-ad-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Prevent flash of login UI before navigate takes over
  }

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
            &gt; Initializing secure connection...<br/>
            &gt; Verifying administrator credentials...<br/>
            &gt; Awaiting authentication.<br/>
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

        <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Admin Authentication</h2>
            <p className="text-ad-text-dim text-sm">Please authenticate to continue.</p>
          </div>

          <SignIn 
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-[#09090B] border border-ad-border hover:bg-ad-accent/10 text-white",
                socialButtonsBlockButtonText: "font-mono font-medium",
                dividerLine: "bg-ad-border",
                dividerText: "text-ad-text-dim",
                formFieldLabel: "text-[11px] font-mono font-medium text-ad-text-dim uppercase tracking-wider",
                formFieldInput: "bg-[#09090B] border border-ad-border text-white focus:border-ad-accent focus:ring-1 focus:ring-ad-accent font-mono",
                formButtonPrimary: "bg-white text-black hover:bg-ad-accent hover:text-white font-bold text-sm transition-all duration-300",
                footerAction: "hidden", // Hide sign up link
                identityPreviewText: "text-white font-mono",
                identityPreviewEditButtonIcon: "text-ad-accent"
              }
            }}
          />

          <div className="mt-8 text-center border-t border-ad-border pt-6 w-full max-w-[380px]">
            <p className="text-[10px] font-mono text-ad-text-dim/50 uppercase tracking-widest">
              Secured by PetStack Identity System v2.0.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

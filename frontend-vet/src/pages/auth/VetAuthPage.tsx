import { useLocation, useNavigate } from "react-router-dom";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

const features = [
  { title: "Patient Records", desc: "Access full histories, lab results & vaccination logs instantly." },
  { title: "Appointment Management", desc: "Smart scheduling with automated reminders." },
  { title: "Veterinary Pharmacy", desc: "Order & track medications from trusted suppliers." },
  { title: "Diagnostics & Reports", desc: "Receive and analyse lab results from integrated labs." },
];

const images = [
  { src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80&fit=crop", label: "Veterinary Care" },
  { src: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80&fit=crop", label: "Patient Check-up" },
  { src: "https://images.unsplash.com/photo-1581888227599-779811939961?w=600&q=80&fit=crop", label: "Lab Diagnostics" },
  { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&fit=crop", label: "Animal Wellness" },
];

export default function VetAuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const isSignUp = location.pathname === "/signup";

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vt-bg">
        <div className="animate-spin w-8 h-8 border-4 border-vt-orange border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Prevent flash
  }

  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden">
      {/* LEFT — Deep Teal panel */}
      <div className="hidden lg:flex w-[52%] flex-shrink-0 bg-vt-teal flex-col justify-center px-12 py-10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-vt-mint/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-vt-orange rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(255,159,67,0.45)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>
            <div>
              <span className="font-serif text-2xl font-semibold text-white">Pet<span className="text-vt-orange">Stack</span></span>
              <p className="text-white/40 text-[10px] uppercase tracking-widest leading-none">Professional</p>
            </div>
          </div>

          <div className="font-serif text-[clamp(22px,2.2vw,34px)] text-white font-semibold leading-snug mb-3">
            "Join a network of<br />trusted veterinarians."
          </div>
          <p className="text-white/50 text-[13.5px] leading-relaxed mb-7 max-w-sm">
            The complete professional platform — patient records, scheduling, diagnostics, and more.
          </p>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
            {images.map(({ src, label }) => (
              <div key={label} className="relative rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] group">
                <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-vt-teal-dark/70 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-semibold tracking-wide">{label}</div>
              </div>
            ))}
          </div>

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

      {/* RIGHT — Clerk Component */}
      <div className="flex-1 bg-vt-bg flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-vt-orange rounded-xl flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
              <circle cx="20" cy="10" r="2" />
            </svg>
          </div>
          <span className="font-serif text-2xl font-semibold text-vt-text-dark">Pet<span className="text-vt-orange">Stack</span></span>
        </div>
        
        {isSignUp ? (
          <SignUp signInUrl="/login" fallbackRedirectUrl="/" />
        ) : (
          <SignIn signUpUrl="/signup" fallbackRedirectUrl="/" />
        )}
      </div>
    </div>
  );
}

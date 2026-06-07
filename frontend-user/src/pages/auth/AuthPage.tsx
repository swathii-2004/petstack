import { useLocation, useNavigate } from "react-router-dom";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { PawPrint } from "lucide-react";

const images = [
  { src: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=80&fit=crop", label: "Vet Appointments" },
  { src: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80&fit=crop", label: "Pet Grooming" },
  { src: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80&fit=crop", label: "Food & Nutrition" },
  { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&fit=crop", label: "Pet Accessories" },
];

export default function AuthPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-ps-cream">
        <div className="animate-spin w-8 h-8 border-4 border-ps-green border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Prevent flash
  }

  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden">
      {/* ══ LEFT — Dark green panel ══ */}
      <div className="hidden lg:flex w-[52%] flex-shrink-0 bg-ps-dark flex-col justify-center px-14 py-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-ps-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-ps-green/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-4 text-8xl opacity-5 rotate-12 select-none pointer-events-none text-white">
          <PawPrint size={96} strokeWidth={1} />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-ps-gold rounded-xl flex items-center justify-center text-white shadow-[0_4px_20px_rgba(233,168,58,0.4)]">
              <PawPrint size={22} />
            </div>
            <span className="font-serif text-2xl font-semibold text-white">Pet<span className="text-ps-gold">Stack</span></span>
          </div>

          <div className="font-serif text-[clamp(24px,2.4vw,36px)] text-white font-medium leading-snug mb-4">
            Your pet's happiness,<br/>our priority.
          </div>
          <p className="text-white/50 text-[14px] leading-relaxed mb-8 max-w-sm">
            Book trusted vets, shop quality products, and manage your pet's health — all in one place.
          </p>

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

      {/* ══ RIGHT — Clerk Component ══ */}
      <div className="flex-1 bg-ps-cream flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-ps-gold rounded-xl flex items-center justify-center text-white shadow-[0_4px_20px_rgba(233,168,58,0.4)]">
            <PawPrint size={20} />
          </div>
          <span className="font-serif text-2xl font-semibold text-ps-dark">Pet<span className="text-ps-gold">Stack</span></span>
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

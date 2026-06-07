import { useLocation, useNavigate } from "react-router-dom";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

const features = [
  { title: "Global Reach", desc: "Expand your business and sell pet products to customers nationwide." },
  { title: "Analytics Dashboard", desc: "Track sales, revenue, and product performance in real time." },
  { title: "Fast Payouts", desc: "Get your earnings transferred directly to your bank account." },
  { title: "Inventory Management", desc: "Easily upload products, update stock levels, and fulfill orders." },
];

const images = [
  { src: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80&fit=crop", label: "Sales & Analytics" },
  { src: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&q=80&fit=crop", label: "Inventory Logistics" },
  { src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80&fit=crop", label: "Business Growth" },
  { src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80&fit=crop", label: "E-Commerce" },
];

export default function SellerAuthPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-sl-bg">
        <div className="animate-spin w-8 h-8 border-4 border-sl-emerald border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Prevent flash
  }

  return (
    <div className="fixed inset-0 flex font-sans overflow-hidden">
      {/* ══ LEFT — Deep Indigo panel ══ */}
      <div className="hidden lg:flex w-[52%] flex-shrink-0 bg-sl-indigo flex-col justify-center px-12 py-10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-sl-violet/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-sl-emerald rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(16,185,129,0.35)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M2 7h20" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight text-white">PetStack <span className="text-sl-emerald">Seller</span></span>
              <p className="text-white/40 text-[10px] uppercase tracking-widest leading-none">Commerce Portal</p>
            </div>
          </div>

          <div className="text-[clamp(22px,2.2vw,34px)] text-white font-bold leading-snug mb-3 tracking-tight">
            "Start selling on the<br />premier pet platform."
          </div>
          <p className="text-white/50 text-[13.5px] leading-relaxed mb-7 max-w-sm">
            The complete toolkit for your pet business — track inventory, monitor revenue analytics, and fulfill orders efficiently.
          </p>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
            {images.map(({ src, label }) => (
              <div key={label} className="relative rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.35)] group">
                <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-sl-indigo-dk/80 to-transparent" />
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

      {/* ══ RIGHT — Clerk Component ══ */}
      <div className="flex-1 bg-sl-bg flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-sl-emerald rounded-xl flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <path d="M2 7h20" />
            </svg>
          </div>
          <span className="font-bold text-2xl tracking-tight text-sl-text-dark">PetStack <span className="text-sl-emerald">Seller</span></span>
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

import { Navigate, Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import {
  LayoutDashboard, ShoppingBag, Stethoscope, CalendarDays,
  PawPrint, PackageCheck, ShoppingCart, LogOut, ChevronRight
} from "lucide-react";

const NAV = [
  { to: "/",            icon: LayoutDashboard, label: "Dashboard",    end: true  },
  { to: "/products",    icon: ShoppingBag,     label: "Shop",         end: false },
  { to: "/vets",        icon: Stethoscope,     label: "Find a Vet",   end: false },
  { to: "/appointments",icon: CalendarDays,    label: "Appointments", end: false },
  { to: "/pets",        icon: PawPrint,        label: "My Pets",      end: false },
  { to: "/orders",      icon: PackageCheck,    label: "Orders",       end: false },
];

export default function ProtectedRoute() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items, setDrawerOpen } = useCartStore();
  const navigate = useNavigate();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role !== "user") {
    return (
      <div className="min-h-screen bg-ps-cream flex items-center justify-center font-sans">
        <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogOut className="text-red-500" size={28} />
          </div>
          <h2 className="text-xl font-bold text-ps-text-dark mb-2">Access Denied</h2>
          <p className="text-ps-text-mid text-sm mb-6">
            Your account (<strong>{user?.role}</strong>) does not have access to the User App.
          </p>
          <a href="/login" className="inline-block bg-ps-dark text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-ps-darker text-sm transition-colors">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex h-screen bg-ps-cream font-sans overflow-hidden">
      {/* ── DARK SIDEBAR ── */}
      <aside className="w-60 flex-shrink-0 bg-ps-dark flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-ps-gold rounded-xl flex items-center justify-center shadow-lg">
              <PawPrint size={18} className="text-ps-dark" />
            </div>
            <span className="font-serif text-xl font-semibold text-white">
              Pet<span className="text-ps-gold">Stack</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-white/30 px-3 mb-3">Menu</p>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 no-underline group ${
                  isActive
                    ? "bg-ps-gold text-ps-dark font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? "text-ps-dark" : "text-white/50 group-hover:text-white"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-ps-dark/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-ps-green rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-[13px] font-semibold truncate">{user?.full_name}</p>
              <p className="text-white/40 text-[11px] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full py-2 flex items-center justify-center gap-2 text-[12.5px] font-semibold text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-150">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-ps-cream-2 px-8 flex items-center justify-between flex-shrink-0 shadow-sm">
          <p className="text-[13px] text-ps-text-mid">
            {greeting},{" "}
            <span className="font-semibold text-ps-text-dark">{user?.full_name?.split(" ")[0]}</span>
          </p>
          <button onClick={() => setDrawerOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center bg-ps-cream rounded-xl hover:bg-ps-cream-2 transition-colors">
            <ShoppingCart size={18} className="text-ps-text-mid" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-ps-gold text-ps-dark text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto bg-ps-cream">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
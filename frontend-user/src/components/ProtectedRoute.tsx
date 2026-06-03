import { useState } from "react";
import { Navigate, Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import {
  LayoutDashboard, ShoppingBag, Stethoscope, CalendarDays,
  PawPrint, PackageCheck, ShoppingCart, LogOut, ChevronRight,
  Menu, X
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role !== "user") {
    return (
      <div className="min-h-screen bg-neutral-ivory flex items-center justify-center font-sans">
        <div className="bg-neutral-raised rounded-custom border border-neutral-border shadow-hairline-md p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-custom flex items-center justify-center mx-auto mb-4">
            <LogOut className="text-red-500" size={28} />
          </div>
          <h2 className="text-xl font-bold text-neutral-textPrimary mb-2">Access Denied</h2>
          <p className="text-neutral-textSecondary text-sm mb-6">
            Your account (<strong>{user?.role}</strong>) does not have access to the User App.
          </p>
          <a href="/login" className="inline-block bg-brand-primary text-white px-6 py-2.5 rounded-custom font-semibold hover:bg-brand-secondary text-sm transition-colors shadow-hairline-sm">
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
    <div className="flex h-screen bg-neutral-ivory font-sans overflow-hidden">
      {/* Overlay Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── COLLAPSIBLE DARK SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-brand-primary flex flex-col h-full transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-accent rounded-custom flex items-center justify-center shadow-hairline-sm">
              <PawPrint size={18} className="text-brand-primary" />
            </div>
            <span className="font-serif text-xl font-semibold text-white tracking-tight">
              Pet<span className="text-brand-accent">Stack</span>
            </span>
          </div>
          {/* Close button for mobile sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 text-white/65 hover:text-white rounded-custom focus-visible:ring-2 focus-visible:ring-brand-accent transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-white/35 px-3 mb-4 font-semibold">Menu</p>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-custom text-[13px] font-medium transition-all duration-150 no-underline group ${
                  isActive
                    ? "bg-brand-accent text-brand-primary font-bold shadow-hairline-sm"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? "text-brand-primary" : "text-white/50 group-hover:text-white"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-brand-primary/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-5 py-5 border-t border-white/5 bg-brand-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-brand-secondary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-[13px] font-semibold truncate">{user?.full_name}</p>
              <p className="text-white/40 text-[11px] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold text-white/50 hover:text-white hover:bg-white/5 rounded-custom transition-all duration-150 border border-white/10 cursor-pointer">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-neutral-raised border-b border-neutral-border px-6 md:px-8 flex items-center justify-between flex-shrink-0 shadow-hairline-sm z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-neutral-textSecondary hover:text-neutral-textPrimary hover:bg-neutral-border rounded-custom transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <p className="text-[13px] text-neutral-textSecondary">
              {greeting},{" "}
              <span className="font-semibold text-neutral-textPrimary">{user?.full_name?.split(" ")[0]}</span>
            </p>
          </div>
          <button onClick={() => setDrawerOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center bg-neutral-ivory rounded-custom hover:bg-neutral-border transition-colors border border-neutral-border/50 cursor-pointer">
            <ShoppingCart size={18} className="text-neutral-textSecondary" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-brand-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-hairline-sm">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto bg-neutral-ivory">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
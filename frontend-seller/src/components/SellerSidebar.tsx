import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  LogOut,
  Store,
} from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package, end: false },
  { to: "/orders", label: "Orders", icon: ShoppingCart, end: false },
  { to: "/payouts", label: "Payouts", icon: CreditCard, end: false },
];

export default function SellerSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-sl-indigo flex flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.15)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-sl-emerald rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_2px_12px_rgba(16,185,129,0.4)]">
          <Store size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-[15px] tracking-tight text-white leading-tight">
            PetStack <span className="text-sl-emerald">Seller</span>
          </p>
          <p className="text-white/40 text-[9px] uppercase tracking-widest leading-none">
            Commerce
          </p>
        </div>
      </div>

      {/* Seller info */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sl-violet/30 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {(user?.business_name || user?.full_name || "S")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-[13px] font-semibold truncate leading-tight">
              {user?.business_name || user?.full_name || "Seller"}
            </p>
            <p className="text-white/40 text-[11px] leading-tight">Partner</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold px-3 mb-2">
          Menu
        </p>
        {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={isActive ? "text-sl-emerald" : "text-white/50"}
                />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sl-emerald" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-150"
        >
          <LogOut size={17} className="text-white/50" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

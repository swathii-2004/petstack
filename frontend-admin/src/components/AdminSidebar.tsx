import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Command Dashboard", icon: LayoutDashboard, end: true },
  { to: "/approvals", label: "Pending Approvals", icon: CheckSquare, end: false },
  { to: "/users", label: "User Management", icon: Users, end: false },
  { to: "/analytics", label: "System Analytics", icon: BarChart3, end: false },
];

export default function AdminSidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#050505] border-r border-ad-border flex flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-ad-border">
        <div className="w-10 h-10 bg-ad-accent/10 border border-ad-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="absolute inset-0 bg-ad-accent/5 animate-pulse" />
          <ShieldCheck size={20} className="text-ad-accent relative z-10" />
        </div>
        <div>
          <p className="font-bold text-[15px] tracking-tight text-white leading-tight">
            PetStack <span className="text-transparent bg-clip-text bg-gradient-to-r from-ad-accent to-ad-neon">Admin</span>
          </p>
          <p className="text-ad-text-dim text-[9px] uppercase tracking-[0.2em] leading-none mt-0.5 font-mono">
            Command Center
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="text-ad-text-dim/60 text-[10px] uppercase tracking-[0.15em] font-mono font-semibold px-2 mb-3">
          Modules
        </p>
        {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative overflow-hidden group ${
                isActive
                  ? "text-white bg-ad-card border border-ad-border shadow-md"
                  : "text-ad-text-dim hover:text-white hover:bg-ad-card/50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-ad-accent to-ad-neon rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
                <Icon
                  size={18}
                  className={isActive ? "text-ad-accent" : "text-ad-text-dim group-hover:text-ad-accent/70 transition-colors"}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Logout (Clerk) */}
      <div className="px-6 py-5 border-t border-ad-border bg-[#09090B] flex items-center gap-3">
        <UserButton 
          afterSignOutUrl="/login" 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-10 h-10 border border-ad-border",
              userButtonPopoverCard: "bg-[#09090B] border border-ad-border text-white",
            }
          }}
        />
        <div className="min-w-0">
          <p className="text-white text-[13px] font-semibold truncate leading-tight">
            {user?.full_name || user?.email || "System Admin"}
          </p>
          <p className="text-ad-text-dim text-[11px] leading-tight font-mono mt-0.5 tracking-wider">
            ROOT_ACCESS
          </p>
        </div>
      </div>
    </aside>
  );
}

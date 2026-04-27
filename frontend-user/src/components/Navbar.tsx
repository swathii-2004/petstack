import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Shop", end: false },
  { to: "/vets", label: "Find a Vet", end: false },
  { to: "/appointments", label: "Appointments", end: false },
  { to: "/pets", label: "My Pets", end: false },
  { to: "/orders", label: "Orders", end: false },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { items, setDrawerOpen } = useCartStore();
  const navigate = useNavigate();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#eef2e8] px-16 h-16 flex items-center justify-between font-sans shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 bg-ps-green rounded-[9px] flex items-center justify-center text-lg shadow-[0_3px_10px_rgba(59,109,17,0.25)]">🐾</div>
        <span className="font-serif text-[22px] font-semibold text-ps-text-dark">
          Pet<span className="text-ps-green">Stack</span>
        </span>
      </NavLink>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-xl text-[13.5px] font-medium no-underline transition-all duration-150 ${
                isActive
                  ? "bg-ps-green-pale text-ps-green font-semibold"
                  : "text-ps-text-mid hover:bg-ps-green-pale hover:text-ps-green"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative w-10 h-10 flex items-center justify-center bg-[#f9fbf6] border border-[#eef2e8] rounded-xl text-lg hover:bg-ps-green-pale hover:border-ps-green-mid transition-all duration-150"
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-ps-green text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <span className="hidden md:block text-[13.5px] font-medium text-gray-700">
          {user?.full_name?.split(" ")[0]}
        </span>
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 border border-ps-green-mid text-ps-green text-[13.5px] font-semibold rounded-xl hover:bg-ps-green hover:text-white hover:border-ps-green transition-all duration-150"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

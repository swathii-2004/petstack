import React from "react";
import { NavLink } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { UserButton } from "@clerk/clerk-react";
import { PawPrint, ShoppingCart } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Shop", end: false },
  { to: "/vets", label: "Find a Vet", end: false },
  { to: "/appointments", label: "Appointments", end: false },
  { to: "/pets", label: "My Pets", end: false },
  { to: "/orders", label: "Orders", end: false },
];

export default function Navbar() {
  const { items, setDrawerOpen } = useCartStore();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#eef2e8] px-16 h-16 flex items-center justify-between font-sans shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 bg-ps-green rounded-[9px] flex items-center justify-center text-white shadow-[0_3px_10px_rgba(59,109,17,0.25)]">
          <PawPrint size={18} />
        </div>
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative w-10 h-10 flex items-center justify-center bg-[#f9fbf6] border border-[#eef2e8] rounded-xl text-lg hover:bg-ps-green-pale hover:border-ps-green-mid transition-all duration-150 text-gray-600"
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-ps-green text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <div className="h-8 w-px bg-[#eef2e8] mx-1"></div>
        <UserButton 
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              userButtonAvatarBox: "w-9 h-9 border border-[#eef2e8]",
              userButtonPopoverCard: "bg-white",
            }
          }}
        />
      </div>
    </nav>
  );
}

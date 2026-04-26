import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

const NAV_LINKS = [
  { to: "/products", label: "Shop" },
  { to: "/vets", label: "Find a Vet" },
  { to: "/appointments", label: "Appointments" },
  { to: "/pets", label: "My Pets" },
  { to: "/orders", label: "Orders" },
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
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <a href="/products" className="font-bold text-xl text-indigo-600">🐾 PetStack</a>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative p-2 rounded-lg hover:bg-gray-100"
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
        <span className="text-sm text-gray-600 hidden md:block">{user?.full_name}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

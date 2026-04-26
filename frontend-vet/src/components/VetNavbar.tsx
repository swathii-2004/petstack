import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const NAV_LINKS = [
  { to: "/appointments", label: "📅 Appointments" },
  { to: "/availability", label: "🗓️ Availability" },
];

export default function VetNavbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <a href="/" className="font-bold text-xl text-indigo-600">🐾 PetStack Vet</a>

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
        <span className="text-sm text-gray-600 hidden md:block">
          Dr. {user?.full_name || user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

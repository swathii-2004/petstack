import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/appointments";
import {
  CalendarDays,
  Clock4,
  CheckCircle2,
  ArrowRight,
  CalendarCheck,
  BarChart2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function VetDashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["vet-dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const statCards = [
    {
      label: "Today's Sessions",
      value: stats?.today_appointments,
      sub: "Confirmed for today",
      icon: CalendarDays,
      bg: "bg-vt-teal/10",
      iconColor: "text-vt-teal",
      subColor: "text-vt-text-mid",
      border: "border-vt-teal/20",
    },
    {
      label: "Pending Requests",
      value: stats?.pending_requests,
      sub: "Awaiting your approval",
      icon: Clock4,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      subColor: "text-amber-600",
      border: "border-amber-100",
    },
    {
      label: "Completed",
      value: stats?.total_completed,
      sub: "Total successful sessions",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      subColor: "text-vt-text-mid",
      border: "border-emerald-100",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-7">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-semibold text-vt-text-dark">
          Good day, Dr. {user?.full_name?.split(" ")[0] || "Doctor"}
        </h1>
        <p className="text-vt-text-mid text-sm mt-1">
          Here's a summary of your appointments and schedule.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map(({ label, value, sub, icon: Icon, bg, iconColor, subColor, border }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl border ${border} p-6 relative overflow-hidden group`}
          >
            {/* Background watermark icon */}
            <Icon
              size={72}
              className={`absolute -bottom-3 -right-3 opacity-[0.05] ${iconColor} pointer-events-none`}
            />
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={20} className={iconColor} />
            </div>
            <p className="text-3xl font-bold text-vt-text-dark mb-1">
              {isLoading ? (
                <span className="inline-block w-8 h-7 bg-vt-bg rounded animate-pulse" />
              ) : (
                value ?? 0
              )}
            </p>
            <p className="text-[13px] font-semibold text-vt-text-mid">{label}</p>
            <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          to="/appointments"
          className="group bg-white border border-vt-border hover:border-vt-teal/40 hover:shadow-md rounded-2xl p-6 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-vt-teal/10 rounded-xl flex items-center justify-center">
              <CalendarCheck size={20} className="text-vt-teal" />
            </div>
            <ArrowRight
              size={18}
              className="text-vt-text-mid group-hover:text-vt-teal group-hover:translate-x-1 transition-all"
            />
          </div>
          <h3 className="text-[15px] font-semibold text-vt-text-dark mb-1">Manage Appointments</h3>
          <p className="text-sm text-vt-text-mid leading-relaxed">
            View, accept, or reject incoming appointment requests and manage active consultations.
          </p>
        </Link>

        <Link
          to="/availability"
          className="group bg-white border border-vt-border hover:border-vt-mint/60 hover:shadow-md rounded-2xl p-6 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-vt-mint/20 rounded-xl flex items-center justify-center">
              <BarChart2 size={20} className="text-vt-teal" />
            </div>
            <ArrowRight
              size={18}
              className="text-vt-text-mid group-hover:text-vt-teal group-hover:translate-x-1 transition-all"
            />
          </div>
          <h3 className="text-[15px] font-semibold text-vt-text-dark mb-1">Update Availability</h3>
          <p className="text-sm text-vt-text-mid leading-relaxed">
            Set your weekly schedule, define working hours, and block out dates when unavailable.
          </p>
        </Link>
      </div>
    </div>
  );
}

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getUserAppointments } from "../../api/appointments";
import { getUserOrders } from "../../api/orders";
import { useAuthStore } from "../../store/authStore";
import {
  PawPrint, Stethoscope, ShoppingBag, CalendarDays,
  CalendarCheck, Package, ArrowRight, BadgeAlert
} from "lucide-react";

export default function UserDashboardPage() {
  const { user } = useAuthStore();

  const { data: appointmentsData, isLoading: isLoadingAppts } = useQuery({
    queryKey: ["user-appointments"],
    queryFn: () => getUserAppointments(1, "accepted"),
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["user-orders"],
    queryFn: () => getUserOrders(1),
  });

  const upcomingAppts = appointmentsData?.items?.filter(a => new Date(a.date) >= new Date()) || [];
  const recentOrders = ordersData?.items?.slice(0, 3) || [];

  const quickLinks = [
    { to: "/pets",         Icon: PawPrint,    label: "My Pets",      sub: "Manage profiles",     color: "bg-ps-green-pale text-ps-green" },
    { to: "/vets",         Icon: Stethoscope, label: "Find a Vet",   sub: "Book appointment",    color: "bg-blue-50 text-blue-600" },
    { to: "/products",     Icon: ShoppingBag, label: "Shop",         sub: "Browse products",     color: "bg-ps-gold/20 text-amber-700" },
    { to: "/appointments", Icon: CalendarDays,label: "Schedule",     sub: "View appointments",   color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-8 space-y-8 font-sans">
      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-3xl bg-ps-dark px-10 py-10">
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-ps-gold/10 blur-3xl" />
        <div className="absolute bottom-0 right-32 w-40 h-40 rounded-full bg-ps-green/30 blur-2xl" />
        <div className="absolute top-5 right-8 opacity-5">
          <PawPrint size={96} className="text-white" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-ps-gold/20 text-ps-gold text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-ps-gold/30">
            <span className="w-1.5 h-1.5 rounded-full bg-ps-gold animate-pulse" />
            Pet Owner Dashboard
          </div>
          <h1 className="font-serif text-3xl font-semibold text-white mb-2">
            Welcome back, {user?.full_name?.split(" ")[0] || "Pet Parent"}!
          </h1>
          <p className="text-white/55 text-[14px] max-w-md leading-relaxed">
            Manage your pet's health, book trusted vets, and shop premium supplies — all in one place.
          </p>
        </div>
      </div>

      {/* ── QUICK LINKS ── */}
      <div className="grid grid-cols-4 gap-5">
        {quickLinks.map(({ to, Icon, label, sub, color }) => (
          <Link key={to} to={to}
            className="group bg-white rounded-2xl p-5 border border-ps-cream-2 no-underline hover:border-ps-green hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="font-semibold text-ps-text-dark text-[14px]">{label}</p>
            <p className="text-ps-text-mid text-[12px] mt-0.5">{sub}</p>
            <div className="flex items-center gap-1 mt-3 text-ps-green text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Open <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="grid grid-cols-[3fr_2fr] gap-6">
        {/* Appointments */}
        <div className="bg-white rounded-3xl p-7 border border-ps-cream-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-ps-green-pale rounded-xl flex items-center justify-center">
                <CalendarCheck size={17} className="text-ps-green" />
              </div>
              <div>
                <h2 className="font-semibold text-[16px] text-ps-text-dark">Upcoming Appointments</h2>
                <p className="text-[11px] text-ps-text-mid">{upcomingAppts.length} confirmed</p>
              </div>
            </div>
            <Link to="/appointments" className="flex items-center gap-1 text-[12.5px] font-semibold text-ps-green hover:underline no-underline px-3 py-1.5 bg-ps-green-pale rounded-xl">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {isLoadingAppts ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-ps-cream animate-pulse rounded-2xl" />)}</div>
          ) : upcomingAppts.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppts.slice(0, 3).map(appt => (
                <div key={appt.id} className="flex items-center gap-4 p-4 bg-ps-cream rounded-2xl hover:bg-ps-green-pale/50 transition-colors">
                  <div className="w-10 h-10 bg-ps-green-pale rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarDays size={17} className="text-ps-green" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[14px] text-ps-text-dark">
                      {new Date(appt.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[12px] text-ps-text-mid">{appt.time_slot} • {appt.pet_details?.name || "Pet"}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-ps-green-pale text-ps-green text-[10px] font-bold uppercase tracking-wide rounded-full">Confirmed</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-ps-cream rounded-2xl border-2 border-dashed border-ps-cream-2">
              <div className="w-12 h-12 bg-ps-green-pale rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CalendarDays size={22} className="text-ps-green" />
              </div>
              <p className="text-[13px] text-ps-text-mid mb-4">No upcoming appointments.</p>
              <Link to="/vets" className="inline-flex items-center gap-1.5 bg-ps-dark text-white px-5 py-2 rounded-xl text-[13px] font-semibold hover:bg-ps-darker no-underline transition-colors">
                <Stethoscope size={14} /> Book a Vet
              </Link>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="bg-white rounded-3xl p-7 border border-ps-cream-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-ps-gold/20 rounded-xl flex items-center justify-center">
                <Package size={17} className="text-amber-700" />
              </div>
              <div>
                <h2 className="font-semibold text-[16px] text-ps-text-dark">Recent Orders</h2>
                <p className="text-[11px] text-ps-text-mid">{recentOrders.length} orders</p>
              </div>
            </div>
            <Link to="/orders" className="flex items-center gap-1 text-[12.5px] font-semibold text-ps-green hover:underline no-underline px-3 py-1.5 bg-ps-green-pale rounded-xl">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {isLoadingOrders ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-ps-cream animate-pulse rounded-2xl" />)}</div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 p-4 bg-ps-cream rounded-2xl hover:bg-ps-gold/10 transition-colors">
                  <div className="w-10 h-10 bg-ps-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={17} className="text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] text-ps-text-dark">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[12px] text-ps-text-mid">{order.items.length} items · ${order.total_amount.toFixed(2)}</p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${
                    order.status === "completed" || order.status === "confirmed"
                      ? "bg-ps-green-pale text-ps-green"
                      : "bg-ps-gold/20 text-amber-700"
                  }`}>{order.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-ps-cream rounded-2xl border-2 border-dashed border-ps-cream-2">
              <div className="w-12 h-12 bg-ps-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={22} className="text-amber-700" />
              </div>
              <p className="text-[13px] text-ps-text-mid mb-4">No orders placed yet.</p>
              <Link to="/products" className="inline-flex items-center gap-1.5 bg-ps-gold text-ps-dark px-5 py-2 rounded-xl text-[13px] font-semibold hover:bg-amber-500 no-underline transition-colors">
                <ShoppingBag size={14} /> Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

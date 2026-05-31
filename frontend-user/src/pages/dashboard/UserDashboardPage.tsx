import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getUserAppointments } from "../../api/appointments";
import { getUserOrders } from "../../api/orders";
import { useAuthStore } from "../../store/authStore";
import {
  PawPrint, 
  Stethoscope, 
  ShoppingBag, 
  CalendarDays,
  CalendarCheck, 
  Package, 
  ArrowRight,
  Sparkles,
  Heart,
  ChevronRight,
  TrendingUp,
  Clock
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
    { to: "/pets",         Icon: PawPrint,    label: "My Pets",      sub: "Manage health profiles",  color: "bg-ps-green bg-ps-green/10 text-ps-green" },
    { to: "/vets",         Icon: Stethoscope, label: "Find a Vet",   sub: "Book top specialists",    color: "bg-blue-50 text-blue-600 border border-blue-100" },
    { to: "/products",     Icon: ShoppingBag, label: "Shop Supplies",sub: "Premium pet essentials",   color: "bg-amber-50 text-amber-600 border border-amber-100" },
    { to: "/appointments", Icon: CalendarDays,label: "Schedule",     sub: "View vet bookings",      color: "bg-purple-50 text-purple-600 border border-purple-100" },
  ];

  return (
    <div className="min-h-screen bg-ps-cream/30 p-8 space-y-8 font-sans">
      
      {/* ── STUNNING HERO HERO ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ps-dark to-ps-green px-8 py-10 shadow-lg border border-ps-green/10">
        {/* Abstract Blur Orbs */}
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-ps-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-ps-green-mid/20 blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 opacity-5 pointer-events-none">
          <PawPrint size={180} className="text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-ps-gold/20 text-ps-gold text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-ps-gold/20">
            <Sparkles className="w-3.5 h-3.5" />
            Pet Owner Portal
          </div>
          
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight">
            Welcome back, <span className="text-ps-gold">{user?.full_name?.split(" ")[0] || "Pet Parent"}</span>!
          </h1>
          
          <p className="text-white/70 text-sm md:text-base font-medium leading-relaxed">
            Manage your pet's appointment schedule, track ongoing shop orders, and browse certified veterinary professionals all in one unified control center.
          </p>

          {/* Quick Metrics Strips */}
          <div className="pt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-white border border-white/5">
              <CalendarCheck className="w-4 h-4 text-ps-gold" />
              <span className="font-semibold">{upcomingAppts.length} Bookings Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-white border border-white/5">
              <Package className="w-4 h-4 text-ps-gold" />
              <span className="font-semibold">{recentOrders.length} Recent Purchases</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK NAVIGATION GRID ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ps-text-mid mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickLinks.map(({ to, Icon, label, sub, color }) => (
            <Link 
              key={to} 
              to={to}
              className="group bg-white rounded-2xl p-5 border border-ps-cream-2 hover:border-ps-green/30 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 block no-underline"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-105 ${color}`}>
                <Icon size={22} />
              </div>
              <p className="font-bold text-ps-dark text-[15px]">{label}</p>
              <p className="text-ps-text-mid text-[12px] mt-1 font-medium leading-relaxed">{sub}</p>
              
              <div className="flex items-center gap-1.5 mt-4 text-ps-green text-[12px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Proceed <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CONTENT PANELS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Appointments */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-ps-cream-2 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ps-green-pale rounded-xl flex items-center justify-center">
                <CalendarCheck size={18} className="text-ps-green" />
              </div>
              <div>
                <h2 className="font-bold text-[16px] text-ps-dark">Upcoming Appointments</h2>
                <p className="text-[11px] text-ps-text-mid font-semibold">Active sessions with verified vets</p>
              </div>
            </div>
            <Link 
              to="/appointments" 
              className="flex items-center gap-1 text-[12px] font-bold text-ps-green hover:underline no-underline px-3.5 py-2 bg-ps-green-pale rounded-xl transition-all"
            >
              All Schedule <ArrowRight size={12} />
            </Link>
          </div>

          {isLoadingAppts ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-18 bg-ps-cream animate-pulse rounded-2xl border" />
              ))}
            </div>
          ) : upcomingAppts.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppts.slice(0, 3).map(appt => (
                <div 
                  key={appt.id} 
                  className="flex items-center gap-4 p-4 bg-ps-cream/40 border border-ps-cream-2/50 rounded-2xl hover:bg-ps-green-pale/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-ps-green-pale text-ps-green rounded-xl flex items-center justify-center flex-shrink-0 border border-ps-green/10">
                    <CalendarDays size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ps-dark line-clamp-1">
                      {new Date(appt.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-ps-text-mid font-medium mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.time_slot} · {(appt as any).pet_details?.name || "Pet"}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-ps-cream/20 rounded-2xl border-2 border-dashed border-ps-cream-2">
              <div className="w-12 h-12 bg-ps-green-pale rounded-full flex items-center justify-center mx-auto mb-3">
                <Stethoscope size={20} className="text-ps-green" />
              </div>
              <h4 className="font-bold text-ps-dark text-sm">No bookings scheduled</h4>
              <p className="text-xs text-ps-text-mid mt-1 mb-5">Your calendar is empty. Schedule a consultation with a certified vet.</p>
              <Link 
                to="/vets" 
                className="inline-flex items-center gap-1.5 bg-ps-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-ps-darker no-underline shadow-sm transition-colors"
              >
                <Stethoscope size={14} /> Book a Vet Now
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Recent Orders */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-ps-cream-2 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ps-gold/10 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-ps-gold" />
              </div>
              <div>
                <h2 className="font-bold text-[16px] text-ps-dark">Recent Orders</h2>
                <p className="text-[11px] text-ps-text-mid font-semibold">Your purchase and delivery history</p>
              </div>
            </div>
            <Link 
              to="/orders" 
              className="flex items-center gap-1 text-[12px] font-bold text-ps-green hover:underline no-underline px-3.5 py-2 bg-ps-green-pale rounded-xl transition-all"
            >
              All Purchases <ArrowRight size={12} />
            </Link>
          </div>

          {isLoadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-18 bg-ps-cream animate-pulse rounded-2xl border" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => {
                const firstItem = order.items?.[0];
                return (
                  <div 
                    key={order.id} 
                    className="flex items-center gap-3 p-4 bg-ps-cream/40 border border-ps-cream-2/50 rounded-2xl hover:bg-ps-gold/5 transition-colors justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {firstItem?.image_url ? (
                        <img 
                          src={firstItem.image_url} 
                          alt={firstItem.name} 
                          className="w-12 h-12 object-cover rounded-xl border border-ps-cream-2/50 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-ps-gold/10 text-ps-gold rounded-xl flex items-center justify-center flex-shrink-0 border border-ps-gold/10">
                          <Package size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-ps-dark truncate">
                          {firstItem?.name || `Order #${order.id.slice(-6).toUpperCase()}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-ps-text-mid font-semibold">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · ${order.total_amount.toFixed(2)}
                          </span>
                          {order.items.length > 1 && (
                            <span className="text-[9px] bg-ps-gold/20 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                              +{order.items.length - 1} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border shrink-0 ${
                      order.status === "delivered" || order.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                        : order.status === "shipped" || order.status === "processing"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-100"
                        : "bg-amber-50 text-amber-800 border-amber-100"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-ps-cream/20 rounded-2xl border-2 border-dashed border-ps-cream-2">
              <div className="w-12 h-12 bg-ps-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={20} className="text-ps-gold" />
              </div>
              <h4 className="font-bold text-ps-dark text-sm">No orders placed</h4>
              <p className="text-xs text-ps-text-mid mt-1 mb-5">Discover certified items, food, and grooming products in our shop.</p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-1.5 bg-ps-green text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-ps-green/90 no-underline shadow-sm transition-colors"
              >
                <ShoppingBag size={14} /> Start Shopping Supplies
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

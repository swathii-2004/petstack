import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getUserAppointments } from "../../api/appointments";
import { getUserOrders } from "../../api/orders";
import { productsApi } from "../../api/products";
import { getMyPets } from "../../api/pets";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import {
  PawPrint, 
  Stethoscope, 
  ShoppingBag, 
  CalendarDays,
  CalendarCheck, 
  Package, 
  ArrowRight,
  Sparkles,
  Clock,
  ShoppingCart
} from "lucide-react";
import { Button } from "../../components/ui/button";

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);

  const { data: appointmentsData, isLoading: isLoadingAppts } = useQuery({
    queryKey: ["user-appointments"],
    queryFn: () => getUserAppointments(1, "accepted"),
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["user-orders"],
    queryFn: () => getUserOrders(1),
  });

  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: petsData } = useQuery({
    queryKey: ["user-pets"],
    queryFn: getMyPets,
  });

  const firstPet = petsData?.[0];

  const { data: recommendedData, isLoading: isLoadingRecs } = useQuery({
    queryKey: ["home-recommended-products", selectedCategory, firstPet?.species],
    queryFn: async () => {
      // Try to get personalized recommendations if active category is "all" and pet species is known
      if (selectedCategory === "all" && firstPet?.species) {
        const res = await productsApi.getProducts({
          search: firstPet.species,
          limit: 8
        });
        if (res?.items && res.items.length > 0) {
          return res;
        }
      }
      // General recommendations fallback
      return productsApi.getProducts({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        limit: 8
      });
    }
  });

  const upcomingAppts = appointmentsData?.items?.filter(a => new Date(a.date) >= new Date()) || [];
  const recentOrders = ordersData?.items?.slice(0, 3) || [];
  const recommendedProducts = recommendedData?.items || [];

  return (
    <div className="min-h-screen bg-ps-cream/35 p-8 space-y-8 font-sans">
      
      {/* ── BRAND-THEMED HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ps-dark to-ps-green px-8 py-10 shadow-lg border border-ps-green/10">
        {/* Decorative Blur Orbs */}
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-ps-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-ps-green-mid/20 blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 opacity-5 pointer-events-none">
          <PawPrint size={180} className="text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-ps-gold/20 text-ps-gold text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-ps-gold/20">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Pet Owner Dashboard
          </div>
          
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight">
            Welcome back, <span className="text-ps-gold">{user?.full_name?.split(" ")[0] || "Pet Parent"}</span>!
          </h1>
          
          <p className="text-white/70 text-xs md:text-sm font-medium leading-relaxed">
            Your centralized portal for vet consultations, order status tracking, and personalized pet supplies.
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

      {/* ── TWO COLUMN SCHEDULERS & ORDERS PANELS ── */}
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
            <div className="text-center py-8 bg-ps-cream/25 rounded-2xl border-2 border-dashed border-ps-cream-2/70">
              <div className="w-10 h-10 bg-ps-green-pale rounded-full flex items-center justify-center mx-auto mb-2">
                <Stethoscope size={18} className="text-ps-green" />
              </div>
              <h4 className="font-bold text-ps-dark text-xs">No Active Appointments</h4>
              <p className="text-[11px] text-ps-text-mid mt-0.5 mb-4">Book a consultation with our certified vets.</p>
              <Link 
                to="/vets" 
                className="inline-flex items-center gap-1.5 bg-ps-dark text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-ps-darker no-underline shadow-sm transition-all"
              >
                <Stethoscope size={12} /> Book Vet Consultation
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
            <div className="text-center py-8 bg-ps-cream/25 rounded-2xl border-2 border-dashed border-ps-cream-2/70">
              <div className="w-10 h-10 bg-ps-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShoppingBag size={18} className="text-ps-gold" />
              </div>
              <h4 className="font-bold text-ps-dark text-xs">No Purchases Yet</h4>
              <p className="text-[11px] text-ps-text-mid mt-0.5 mb-4">Browse premium food, treats, and grooming toys.</p>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-1.5 bg-ps-green text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-ps-green/90 no-underline shadow-sm transition-all"
              >
                <ShoppingBag size={12} /> Explore Pet Shop
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── NEW! PREMIUM PRODUCT RECOMMENDATIONS FOR YOU ── */}
      <div className="bg-white rounded-3xl p-6 border border-ps-cream-2 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ps-green-pale rounded-xl flex items-center justify-center">
              <ShoppingBag size={18} className="text-ps-green" />
            </div>
            <div>
              <h2 className="font-bold text-[16px] text-ps-dark">
                {firstPet ? `Recommended for ${firstPet.name} 🐾` : "Recommended Supplies for You"}
              </h2>
              <p className="text-[11px] text-ps-text-mid font-semibold">
                {firstPet 
                  ? `Premium, top-rated essentials for your ${firstPet.species}`
                  : "Premium, highly rated pet foods and essentials"}
              </p>
            </div>
          </div>

          {/* Interactive Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {["all", "food", "grooming", "clothing", "accessories", "other"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-ps-green text-white shadow-sm"
                    : "bg-ps-green-pale/40 text-ps-green hover:bg-ps-green-pale/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Link 
            to="/products" 
            className="flex items-center gap-1 text-[12px] font-bold text-ps-green hover:underline no-underline px-3.5 py-2 bg-ps-green-pale rounded-xl transition-all shrink-0"
          >
            Visit Shop <ArrowRight size={12} />
          </Link>
        </div>

        {isLoadingRecs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse flex flex-col space-y-3">
                <div className="bg-gray-100 h-40 rounded-xl w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendedProducts.map((p: any) => (
              <div 
                key={p._id || p.id} 
                className="group flex flex-col bg-white border border-gray-100 hover:border-ps-green/20 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 relative"
              >
                <Link to={`/products/${p._id || p.id}`} className="aspect-square relative flex-shrink-0 bg-gray-50 overflow-hidden block">
                  {p.image_urls && p.image_urls.length > 0 ? (
                    <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                  )}
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[10px] text-ps-green font-bold uppercase tracking-wider mb-1 capitalize">{p.category}</div>
                  <Link to={`/products/${p._id || p.id}`} className="font-bold text-ps-dark line-clamp-1 hover:text-ps-green transition-colors text-sm no-underline mb-3">
                    {p.name}
                  </Link>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="font-bold text-sm text-ps-dark">${p.price.toFixed(2)}</div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        addItem(p);
                        toast.success(`${p.name} added to cart!`);
                      }}
                      className="bg-ps-green hover:bg-ps-green/90 text-white rounded-full w-8 h-8 p-0 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-gray-400 text-sm font-medium">No recommended products available in this category.</p>
        )}
      </div>

    </div>
  );
}

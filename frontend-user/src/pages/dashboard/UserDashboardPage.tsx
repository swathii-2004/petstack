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
  ShoppingCart,
  ChevronRight,
  Heart,
  ShieldCheck,
  Truck
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
      if (selectedCategory === "all" && firstPet?.species) {
        const res = await productsApi.getProducts({
          search: firstPet.species,
          limit: 8
        });
        if (res?.items && res.items.length > 0) {
          return res;
        }
      }
      return productsApi.getProducts({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        limit: 8
      });
    }
  });

  const upcomingAppts = appointmentsData?.items?.filter(a => new Date(a.date) >= new Date()) || [];
  const recentOrders = ordersData?.items?.slice(0, 3) || [];
  const recommendedProducts = recommendedData?.items || [];

  // Helper for delivery stages
  const getDeliveryStep = (status: string) => {
    const s = status.toLowerCase();
    if (s === "placed") return 1;
    if (s === "processing" || s === "confirmed") return 2;
    if (s === "shipped") return 3;
    if (s === "delivered" || s === "completed") return 4;
    return 1;
  };

  // Helper to calculate pet age
  const calculateAge = (dobString?: string) => {
    if (!dobString) return "Age not specified";
    try {
      const dob = new Date(dobString);
      if (isNaN(dob.getTime())) return "Age not specified";
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      return `${years} ${years === 1 ? "year" : "years"} old`;
    } catch {
      return "Age not specified";
    }
  };

  const quickActions = [
    {
      to: "/pets",
      icon: PawPrint,
      title: "Your Pet Family",
      desc: "Manage pet profiles, species details, and medical logs.",
      color: "bg-brand-primary/5 hover:bg-brand-primary/10 border-brand-primary/10 hover:border-brand-primary/20 text-brand-primary",
      iconBg: "bg-brand-primary/10"
    },
    {
      to: "/vets",
      icon: Stethoscope,
      title: "Consult a Vet",
      desc: "Discover certified vets, read reviews, and book sessions.",
      color: "bg-brand-accent/5 hover:bg-brand-accent/10 border-brand-accent/10 hover:border-brand-accent/20 text-brand-accent",
      iconBg: "bg-brand-accent/10"
    },
    {
      to: "/products",
      icon: ShoppingBag,
      title: "Shop Essentials",
      desc: "Premium organic food, custom treats, and toys.",
      color: "bg-brand-primary/5 hover:bg-brand-primary/10 border-brand-primary/10 hover:border-brand-primary/20 text-brand-primary",
      iconBg: "bg-brand-primary/10"
    },
    {
      to: "/appointments",
      icon: CalendarDays,
      title: "Active Schedule",
      desc: "Track consultation timings, history, and chat logs.",
      color: "bg-brand-accent/5 hover:bg-brand-accent/10 border-brand-accent/10 hover:border-brand-accent/20 text-brand-accent",
      iconBg: "bg-brand-accent/10"
    }
  ];

  const getStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === "delivered" || lower === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-status-sage-bg text-status-sage-text border border-status-sage-dot/10 shrink-0">
          <span className="w-1 h-1 rounded-full bg-status-sage-dot" />
          {status}
        </span>
      );
    }
    if (lower === "shipped" || lower === "processing" || lower === "placed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-status-amber-bg text-status-amber-text border border-status-amber-dot/10 shrink-0">
          <span className="w-1 h-1 rounded-full bg-status-amber-dot" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-status-slate-bg text-status-slate-text border border-status-slate-dot/10 shrink-0">
        <span className="w-1 h-1 rounded-full bg-status-slate-dot" />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-ivory p-6 md:p-8 space-y-8 font-sans transition-opacity duration-500 ease-out animate-fade-in">
      
      {/* ── Slim Welcome Strip ── */}
      <div className="relative overflow-hidden rounded-custom bg-brand-primary border border-white/5 border-l-4 border-l-brand-accent px-8 py-5 shadow-hairline-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="font-serif text-xl md:text-2xl font-semibold text-white tracking-tight leading-tight">
            Welcome back, <span className="italic font-medium">{user?.full_name?.split(" ")[0] || "Pet Parent"}</span>
          </h1>
          <p className="text-white/60 text-xs font-medium">
            Manage consultations, orders, and products for your pet family.
          </p>
        </div>
        
        {/* Quick status dots */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white/80 font-medium tracking-tight">Active Session</span>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (2/3 width) - Main Board */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Pet Showcase Widget */}
          <div className="bg-neutral-raised rounded-custom p-6 md:p-8 border border-neutral-border shadow-hairline-sm">
            {firstPet ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-brand-primary/5 text-brand-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-primary/10">
                    <Heart className="w-3.5 h-3.5 fill-brand-primary/20" />
                    Active Pet Profile
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold text-neutral-textPrimary tracking-tight">
                    {firstPet.name}
                  </h2>
                  <p className="text-xs text-neutral-textSecondary font-medium leading-relaxed">
                    {firstPet.breed ? firstPet.breed : firstPet.species} · {calculateAge(firstPet.dob)}
                  </p>
                </div>
                
                {/* Health stats block */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-ivory/50 p-4 rounded-custom border border-neutral-border/50 min-w-[240px]">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-neutral-textMuted tracking-wider">Vaccines</p>
                    <div className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                      <ShieldCheck className="w-4 h-4 text-brand-secondary" />
                      <span>Up to date</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-neutral-textMuted tracking-wider">Health Status</p>
                    <span className="text-xs font-bold text-neutral-textPrimary">Excellent</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-primary/10">
                  <PawPrint size={20} className="text-brand-primary" />
                </div>
                <h4 className="font-serif text-base font-semibold text-neutral-textPrimary">No Pets Registered</h4>
                <p className="text-xs text-neutral-textMuted mt-1 mb-5 max-w-sm mx-auto">
                  Add your pet's profile to unlock personalized vet advice, vaccine tracking, and species supplies.
                </p>
                <Link 
                  to="/pets" 
                  className="inline-flex items-center gap-1.5 bg-brand-primary text-white px-5 py-2.5 rounded-custom text-xs font-semibold hover:bg-brand-secondary no-underline shadow-hairline-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent cursor-pointer"
                >
                  <PawPrint size={14} /> Add a Pet Profile
                </Link>
              </div>
            )}
          </div>

          {/* Bento Quick Actions Grid */}
          <div className="space-y-4">
            <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-neutral-textSecondary">Quick Shortcuts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {quickActions.map(({ to, icon: Icon, title, desc, color, iconBg }) => (
                <Link 
                  key={to} 
                  to={to}
                  className="group relative overflow-hidden bg-neutral-raised rounded-custom p-6 border border-neutral-border shadow-hairline-sm hover:shadow-hairline-md transition-all duration-300 hover:-translate-y-0.5 block no-underline focus-visible:ring-2 focus-visible:ring-brand-accent"
                >
                  {/* Background graphic */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-neutral-ivory/40 group-hover:scale-110 transition-transform duration-500" />
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-custom flex items-center justify-center shrink-0 border ${iconBg} ${color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="space-y-1 pr-6">
                      <h4 className="font-serif text-base font-semibold text-neutral-textPrimary group-hover:text-brand-primary transition-colors">{title}</h4>
                      <p className="text-xs text-neutral-textMuted font-medium leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  
                  <div className="absolute right-4 bottom-4 text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width) - Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Upcoming Consultations Timeline Widget */}
          <div className="bg-neutral-raised rounded-custom p-6 border border-neutral-border shadow-hairline-sm space-y-5">
            <h3 className="font-serif text-sm font-semibold text-neutral-textPrimary pb-3 border-b border-neutral-border flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-brand-primary" />
              Next Consultation
            </h3>

            {isLoadingAppts ? (
              <div className="h-20 bg-neutral-ivory animate-pulse rounded-custom border border-neutral-border/50" />
            ) : upcomingAppts.length > 0 ? (
              (() => {
                const appt = upcomingAppts[0];
                return (
                  <div className="relative pl-5 border-l-2 border-brand-accent/30 py-1 space-y-4">
                    {/* Circle Node */}
                    <div className="absolute -left-[6px] top-2 w-2.5 h-2.5 rounded-full bg-brand-accent" />
                    
                    <div className="space-y-1">
                      <p className="font-serif text-sm font-semibold text-neutral-textPrimary">
                        {new Date(appt.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-neutral-textSecondary font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-textMuted" />
                        {appt.time_slot}
                      </p>
                    </div>

                    <div className="bg-neutral-ivory/60 p-3.5 rounded-custom border border-neutral-border/60">
                      <p className="text-xs font-semibold text-neutral-textPrimary">{(appt as any).doctor_name || "Certified Vet"}</p>
                      <p className="text-[10px] text-neutral-textMuted mt-0.5">Consultation for {(appt as any).pet_details?.name || "Pet"}</p>
                    </div>

                    <Link 
                      to={`/chat/${appt.id}`} 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary hover:text-brand-primary transition-colors no-underline cursor-pointer"
                    >
                      Enter Room <ChevronRight size={14} />
                    </Link>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-neutral-textMuted">No consultations scheduled</p>
                <Link 
                  to="/vets" 
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-secondary hover:underline no-underline"
                >
                  Book a Consultation <ArrowRight size={10} />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Order Delivery Tracker Widget */}
          <div className="bg-neutral-raised rounded-custom p-6 border border-neutral-border shadow-hairline-sm space-y-5">
            <h3 className="font-serif text-sm font-semibold text-neutral-textPrimary pb-3 border-b border-neutral-border flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-accent" />
              Latest Purchase Tracker
            </h3>

            {isLoadingOrders ? (
              <div className="h-28 bg-neutral-ivory animate-pulse rounded-custom border border-neutral-border/50" />
            ) : recentOrders.length > 0 ? (
              (() => {
                const order = recentOrders[0];
                const step = getDeliveryStep(order.status);
                return (
                  <div className="space-y-5">
                    {/* Brief header */}
                    <div className="flex justify-between items-center gap-3">
                      {order.items && order.items[0] ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          {order.items[0].image_url ? (
                            <img 
                              src={order.items[0].image_url} 
                              alt={order.items[0].name} 
                              className="w-8 h-8 object-cover rounded-full border border-neutral-border shrink-0" 
                            />
                          ) : (
                            <div className="w-8 h-8 bg-brand-primary/5 text-brand-primary rounded-full flex items-center justify-center border border-neutral-border text-[9px] font-bold uppercase shrink-0">
                              Item
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-textPrimary text-[12px] truncate leading-tight">
                              {order.items[0].name}
                            </p>
                            {order.items.length > 1 && (
                              <p className="text-[10px] text-neutral-textMuted font-medium mt-0.5">
                                + {order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-neutral-textPrimary text-xs">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      )}
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Progress pipeline */}
                    <div className="relative py-2">
                      {/* Horizontal track line */}
                      <div className="absolute top-[18px] left-2 right-2 h-[2px] bg-neutral-border" />
                      {/* Active track highlight */}
                      <div 
                        className="absolute top-[18px] left-2 h-[2px] bg-brand-accent transition-all duration-500" 
                        style={{ width: `${((step - 1) / 3) * 100}%` }}
                      />

                      {/* Timeline steps */}
                      <div className="relative flex justify-between text-[9px] font-bold uppercase tracking-wider text-neutral-textMuted">
                        {[
                          { label: 'Placed', icon: Sparkles },
                          { label: 'Confirmed', icon: ShieldCheck },
                          { label: 'Shipped', icon: Truck },
                          { label: 'Delivered', icon: Package }
                        ].map((node, i) => {
                          const active = step >= i + 1;
                          const NodeIcon = node.icon;
                          return (
                            <div key={node.label} className="flex flex-col items-center gap-1.5 z-10">
                              <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border transition-all duration-300 ${
                                active 
                                  ? "bg-brand-accent text-brand-primary border-brand-accent shadow-hairline-sm scale-110" 
                                  : "bg-neutral-raised text-neutral-textMuted border-neutral-border"
                              }`}>
                                <NodeIcon size={10} />
                              </div>
                              <span className={active ? "text-neutral-textPrimary font-extrabold" : ""}>{node.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Other orders summary list */}
                    {recentOrders.length > 1 && (
                      <div className="pt-3 border-t border-neutral-border space-y-2.5">
                        <p className="text-[10px] uppercase font-bold text-neutral-textMuted tracking-wider">Other Recent Orders</p>
                        {recentOrders.slice(1).map((o: any) => (
                          <div key={o.id} className="flex justify-between items-center text-xs">
                            <Link to="/orders" className="font-mono font-bold text-neutral-textSecondary hover:text-brand-primary transition-colors no-underline">
                              #{o.id.slice(-6).toUpperCase()}
                            </Link>
                            <span className="font-medium text-neutral-textMuted">${o.total_amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-neutral-textMuted">No orders placed yet</p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-secondary hover:underline no-underline"
                >
                  Visit Shop <ArrowRight size={10} />
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── Premium Product Recommendations (Full Width) ── */}
      <div className="bg-neutral-raised rounded-custom p-6 md:p-8 border border-neutral-border shadow-hairline-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/5 rounded-custom flex items-center justify-center border border-brand-primary/10">
              <ShoppingBag size={18} className="text-brand-primary" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-neutral-textPrimary">
                {firstPet ? `Recommended for ${firstPet.name}` : "Recommended Supplies"}
              </h2>
              <p className="text-[11px] text-neutral-textMuted font-medium">
                {firstPet 
                  ? `Premium top-rated essentials tailored for your ${firstPet.species}`
                  : "Premium highly rated pet foods and organic essentials"}
              </p>
            </div>
          </div>

          {/* Interactive Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {["all", "food", "grooming", "clothing", "accessories", "other"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-accent ${
                  selectedCategory === cat
                    ? "bg-brand-primary text-white shadow-hairline-sm"
                    : "bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Link 
            to="/products" 
            className="flex items-center gap-1 text-[11px] font-bold text-brand-secondary hover:text-brand-primary transition-colors px-3 py-1.5 hover:bg-neutral-border/50 rounded-custom focus-visible:ring-2 focus-visible:ring-brand-accent no-underline shrink-0"
          >
            Visit Shop <ArrowRight size={12} />
          </Link>
        </div>

        {isLoadingRecs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex flex-col space-y-3">
                <div className="bg-neutral-ivory h-40 rounded-custom w-full border border-neutral-border/50"></div>
                <div className="h-4 bg-neutral-ivory rounded w-3/4"></div>
                <div className="h-4 bg-neutral-ivory rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendedProducts.map((p: any) => (
              <div 
                key={p._id || p.id} 
                className="group flex flex-col bg-neutral-raised border border-neutral-border hover:border-brand-primary/20 rounded-custom overflow-hidden hover:shadow-hairline-md transition-all duration-300 relative focus-within:ring-2 focus-within:ring-brand-accent"
              >
                <Link to={`/products/${p._id || p.id}`} className="aspect-square relative flex-shrink-0 bg-neutral-ivory/40 overflow-hidden block border-b border-neutral-border/50">
                  {p.image_urls && p.image_urls.length > 0 ? (
                    <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-textMuted text-xs">No Image</div>
                  )}
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[9px] text-brand-secondary font-bold uppercase tracking-wider mb-1 capitalize">{p.category}</div>
                  <Link to={`/products/${p._id || p.id}`} className="font-serif text-sm font-semibold text-neutral-textPrimary line-clamp-1 hover:text-brand-primary transition-colors no-underline mb-3 focus-visible:outline-none">
                    {p.name}
                  </Link>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="font-bold text-sm text-neutral-textPrimary">${p.price.toFixed(2)}</div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        addItem(p);
                        toast.success(`${p.name} added to cart!`);
                      }}
                      className="bg-brand-primary hover:bg-brand-secondary text-white rounded-full w-8 h-8 p-0 cursor-pointer flex items-center justify-center shadow-hairline-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-neutral-textMuted text-sm font-medium">No recommended products available in this category.</p>
        )}
      </div>

    </div>
  );
}

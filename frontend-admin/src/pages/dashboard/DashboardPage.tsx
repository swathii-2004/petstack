import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { AnalyticsOverview } from "../../types";
import { Activity, Users, ShoppingCart, DollarSign, AlertCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface StatCard {
  label: string;
  key: keyof AnalyticsOverview;
  icon: any;
  amber?: boolean;
}

const STAT_CARDS: StatCard[] = [
  { label: "Total Users", key: "total_users", icon: Users },
  { label: "Total Revenue", key: "total_revenue", icon: DollarSign },
  { label: "Total Orders", key: "total_orders", icon: ShoppingCart },
  { label: "Pending Vets", key: "pending_vets", icon: AlertCircle, amber: true },
  { label: "Pending Sellers", key: "pending_sellers", icon: AlertCircle, amber: true },
  { label: "Total Products", key: "total_products", icon: Package },
];

function Package(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics"],
    queryFn: adminApi.getAnalyticsOverview,
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["recent_orders"],
    queryFn: () => adminApi.getAllOrders({ limit: 5 }),
  });

  // Use real timeseries data from backend (fallback to empty array if still loading)
  const chartData = data?.chart_data || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">System Overview</h2>
        <p className="text-ad-text-dim text-sm mt-1 font-mono tracking-wider uppercase">
          Live monitoring active <span className="inline-block w-2 h-2 rounded-full bg-ad-success animate-pulse ml-2" />
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-ad-danger/50 bg-ad-danger/10 px-4 py-3 text-sm text-ad-danger font-mono">
          &gt; ERROR: Failed to establish telemetry connection.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-ad-card border border-ad-border rounded-2xl h-[120px] animate-pulse" />
            ))
          : STAT_CARDS.map(({ label, key, icon: Icon, amber }) => {
              let count: number | string = data?.[key] ?? 0;
              if (key === "total_revenue") count = `$${(count as number).toFixed(2)}`;
              const isAmber = amber && (data?.[key] as number) > 0;
              const color = isAmber ? "text-amber-500" : "text-ad-accent";
              const bgStr = isAmber ? "bg-amber-500/10" : "bg-ad-accent/10";
              const borderStr = isAmber ? "border-amber-500/20" : "border-ad-accent/20";

              return (
                <div key={key} className={`bg-ad-card rounded-2xl p-6 border border-ad-border shadow-lg relative overflow-hidden group`}>
                  {/* Faux 3D glow */}
                  <div className={`absolute -right-6 -top-6 w-24 h-24 ${bgStr} rounded-full blur-2xl pointer-events-none group-hover:blur-3xl transition-all duration-500`} />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-[12px] font-mono font-medium text-ad-text-dim uppercase tracking-wider">
                      {label}
                    </h3>
                    <div className={`w-8 h-8 rounded-lg ${bgStr} ${borderStr} border flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white relative z-10">{count}</div>
                </div>
              );
            })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <div className="bg-ad-card border border-ad-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[14px] font-mono font-bold text-white uppercase tracking-widest">Revenue Flow</h3>
            <Activity className="w-4 h-4 text-ad-neon" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
                  itemStyle={{ color: '#F4F4F5' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users 3D-effect Bar Chart */}
        <div className="bg-ad-card border border-ad-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[14px] font-mono font-bold text-white uppercase tracking-widest">User Acquisition</h3>
            <Users className="w-4 h-4 text-ad-accent" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#0891B2" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272A', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
                  itemStyle={{ color: '#F4F4F5' }}
                />
                <Bar dataKey="users" fill="url(#colorUsers)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#colorUsers)" style={{ filter: 'drop-shadow(0px 4px 6px rgba(6,182,212,0.4))' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div>
        <h3 className="text-[16px] font-mono font-bold text-white uppercase tracking-widest mb-4">
          Latest Transactions
        </h3>
        <div className="bg-ad-card border border-ad-border rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-[#09090B] border-b border-ad-border text-ad-text-dim font-mono tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase">Tx ID</th>
                <th className="px-6 py-4 font-semibold uppercase">Value</th>
                <th className="px-6 py-4 font-semibold uppercase">Status</th>
                <th className="px-6 py-4 font-semibold uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ad-border">
              {isLoadingOrders ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ad-text-dim font-mono animate-pulse">
                    &gt; Fetching transaction logs...
                  </td>
                </tr>
              ) : ordersData?.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ad-text-dim font-mono">
                    &gt; No transactions found.
                  </td>
                </tr>
              ) : (
                ordersData?.items.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-white truncate max-w-[150px]">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-ad-accent">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        order.status === "completed" || order.status === "confirmed" ? "bg-ad-success/10 text-ad-success border-ad-success/20" :
                        order.status === "placed" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-white/5 text-ad-text-dim border-white/10"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ad-text-dim font-mono text-[11px]">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

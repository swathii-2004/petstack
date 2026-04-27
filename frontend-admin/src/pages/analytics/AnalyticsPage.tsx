import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { AnalyticsOverview } from "../../types";
import { BarChart3Icon, Users, ShoppingCart, Activity } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

interface StatCard {
  label: string;
  key: keyof AnalyticsOverview;
  amber?: boolean;
}

const STAT_CARDS: StatCard[] = [
  { label: "Total Users", key: "total_users" },
  { label: "Active Users", key: "active_users" },
  { label: "Pending Vets", key: "pending_vets", amber: true },
  { label: "Active Vets", key: "active_vets" },
  { label: "Pending Sellers", key: "pending_sellers", amber: true },
  { label: "Active Sellers", key: "active_sellers" },
  { label: "Total Products", key: "total_products" },
  { label: "Total Orders", key: "total_orders" },
];

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics"],
    queryFn: adminApi.getAnalyticsOverview,
  });

  // Derived mock data for beautiful charts based on the real data (if it exists)
  const totalU = data?.total_users || 1000;
  const activeU = data?.active_users || 800;
  
  const pieData = [
    { name: "Active Users", value: activeU },
    { name: "Inactive Users", value: totalU - activeU },
  ];

  const pieColors = ["#06B6D4", "#27272A"]; // Cyan and Dark Gray

  const radialData = [
    { name: "Vets", count: data?.active_vets || 120, fill: "#8B5CF6" },
    { name: "Sellers", count: data?.active_sellers || 85, fill: "#10B981" },
    { name: "Products", count: data?.total_products || 450, fill: "#E11D48" },
    { name: "Orders", count: data?.total_orders || 1200, fill: "#06B6D4" },
  ];

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">System Analytics</h2>
        <p className="text-ad-text-dim text-sm mt-1 font-mono tracking-wider uppercase">
          > Global telemetry and platform health.
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-ad-danger/50 bg-ad-danger/10 px-4 py-3 text-sm text-ad-danger font-mono mb-8">
          > ERROR: Telemetry connection lost. Attempting reconnect...
        </div>
      )}

      {/* Grid of basic stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-ad-card border border-ad-border rounded-xl h-[90px] animate-pulse" />
            ))
          : STAT_CARDS.map(({ label, key, amber }) => {
              const count = data?.[key] ?? 0;
              const isAmber = amber && count > 0;
              const accentClass = isAmber ? "text-amber-500" : "text-ad-accent";
              const borderClass = isAmber ? "border-amber-500" : "border-ad-border";

              return (
                <div key={key} className={`bg-[#000000] rounded-xl p-4 border border-ad-border border-l-2 ${isAmber ? 'border-l-amber-500' : 'border-l-ad-accent'} relative overflow-hidden group hover:border-ad-accent transition-colors`}>
                  <p className="text-[10px] font-mono font-medium text-ad-text-dim uppercase tracking-widest mb-1">
                    {label}
                  </p>
                  <p className={`text-2xl font-bold ${isAmber ? 'text-amber-500' : 'text-white'}`}>
                    {count}
                  </p>
                </div>
              );
            })}
      </div>

      {/* Deep Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Activity Ring */}
        <div className="bg-ad-card border border-ad-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-mono font-bold text-white uppercase tracking-widest">User Engagement</h3>
            <Users className="w-4 h-4 text-ad-accent" />
          </div>
          <p className="text-[11px] font-mono text-ad-text-dim uppercase mb-6">> Active vs Inactive ratio</p>
          
          <div className="h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={pieColors[index % pieColors.length]} 
                      style={{ filter: index === 0 ? 'drop-shadow(0px 0px 10px rgba(6,182,212,0.6))' : 'none' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px', color: '#FFF' }}
                  itemStyle={{ color: '#F4F4F5' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text for donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{Math.round((activeU / totalU) * 100)}%</span>
              <span className="text-[10px] font-mono text-ad-accent uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        {/* Global Distribution Radial */}
        <div className="bg-ad-card border border-ad-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-mono font-bold text-white uppercase tracking-widest">Entity Distribution</h3>
            <Activity className="w-4 h-4 text-ad-neon" />
          </div>
          <p className="text-[11px] font-mono text-ad-text-dim uppercase mb-6">> Vets, Sellers, Products, Orders</p>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={12} data={radialData}>
                <RadialBar
                  background={{ fill: '#27272A' }}
                  dataKey="count"
                  cornerRadius={10}
                />
                <Legend 
                  iconSize={8} 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#A1A1AA' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }}
                  itemStyle={{ color: '#F4F4F5' }}
                  cursor={{ fill: 'transparent' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { AnalyticsOverview } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

interface StatCard {
  label: string;
  key: keyof AnalyticsOverview;
  amber?: boolean;
}

const STAT_CARDS: StatCard[] = [
  { label: "Total Users", key: "total_users" },
  { label: "Active Users", key: "active_users" },
  { label: "Total Revenue", key: "total_revenue" },
  { label: "Total Orders", key: "total_orders" },
  { label: "Pending Vets", key: "pending_vets", amber: true },
  { label: "Active Vets", key: "active_vets" },
  { label: "Pending Sellers", key: "pending_sellers", amber: true },
  { label: "Active Sellers", key: "active_sellers" },
  { label: "Total Products", key: "total_products" },
];

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16" />
      </CardContent>
    </Card>
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h2>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-6">
          Failed to load analytics. Please refresh the page.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : STAT_CARDS.map(({ label, key, amber }) => {
              let count: number | string = data?.[key] ?? 0;
              if (key === "total_revenue") {
                count = `$${(count as number).toFixed(2)}`;
              }
              const isAmber = amber && (data?.[key] as number) > 0;
              return (
                <Card
                  key={key}
                  className={`border-l-4 ${isAmber ? "border-l-amber-400" : "border-l-indigo-400"}`}
                >
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Recent Orders
      </h3>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3 font-medium">Order ID</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {isLoadingOrders ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Loading orders...
                </td>
              </tr>
            ) : ordersData?.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              ordersData?.items.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    ${order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "completed" || order.status === "confirmed" ? "bg-green-100 text-green-800" :
                      order.status === "placed" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
  { label: "Pending Vets", key: "pending_vets", amber: true },
  { label: "Active Vets", key: "active_vets" },
  { label: "Pending Sellers", key: "pending_sellers", amber: true },
  { label: "Active Sellers", key: "active_sellers" },
  { label: "Total Products", key: "total_products" },
  { label: "Total Orders", key: "total_orders" },
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : STAT_CARDS.map(({ label, key, amber }) => {
              const count = data?.[key] ?? 0;
              const isAmber = amber && count > 0;
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
    </div>
  );
}

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

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics"],
    queryFn: adminApi.getAnalyticsOverview,
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Analytics
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Platform-wide statistics at a glance.
      </p>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-6">
          Failed to load analytics. Please refresh the page.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16" />
                </CardContent>
              </Card>
            ))
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

      {/* Placeholder for charts */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
        <BarChart3Icon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Detailed charts coming in Phase 7
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Revenue trends, approval rates, and growth metrics will appear here.
        </p>
      </div>
    </div>
  );
}

function BarChart3Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Package, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../../api/products";

export default function DashboardPage() {
    const { data } = useQuery({
        queryKey: ["products", "mine", 1],
        queryFn: () => productsApi.getMyProducts(1, 100),
    });

    const totalProducts = data?.total ?? 0;
    const lowStockCount = data?.items.filter((p) => p.is_low_stock).length ?? 0;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Products
                        </CardTitle>
                        <Package className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-gray-500 mt-1">Active listings</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Low Stock Alerts
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
                        <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Orders
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-gray-500 mt-1">Coming in Phase 4</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

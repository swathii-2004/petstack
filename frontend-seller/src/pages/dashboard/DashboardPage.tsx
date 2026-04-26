import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Package, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { getSellerOrders } from "../../api/orders";

export default function DashboardPage() {
    const { data } = useQuery({
        queryKey: ["products", "mine", 1],
        queryFn: () => productsApi.getMyProducts(1, 100),
    });

    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ["seller-orders", 1],
        queryFn: () => getSellerOrders(1, "all"),
    });

    const totalProducts = data?.total ?? 0;
    const lowStockCount = data?.items.filter((p) => p.is_low_stock).length ?? 0;
    const totalOrders = ordersData?.total ?? 0;
    const recentOrders = ordersData?.items?.slice(0, 5) || [];

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
                        <div className="text-2xl font-bold">{isLoadingOrders ? "-" : totalOrders}</div>
                        <p className="text-xs text-gray-500 mt-1">Total received orders</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Recent Orders
                </h3>
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3 font-medium">Order ID</th>
                                <th className="px-6 py-3 font-medium">Items</th>
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
                            ) : recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order: any) => {
                                    // Count items in this order that belong to this seller
                                    const sellerItemCount = order.items.length;
                                    return (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                                            {order.id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {sellerItemCount} item(s)
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
                                )})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

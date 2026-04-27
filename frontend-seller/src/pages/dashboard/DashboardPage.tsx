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
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h2 className="text-[26px] font-bold text-sl-text-dark tracking-tight">
                    Overview
                </h2>
                <p className="text-sl-text-mid text-sm mt-1">
                    Track your business performance and pending tasks.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Products */}
                <div className="bg-sl-bg-card rounded-2xl p-6 border-l-[5px] border-sl-indigo shadow-sm border border-sl-border relative overflow-hidden group">
                    <Package className="absolute -bottom-4 -right-4 w-24 h-24 text-sl-indigo opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[13px] font-semibold text-sl-text-mid uppercase tracking-wider">
                            Total Products
                        </h3>
                        <div className="w-8 h-8 rounded-lg bg-sl-indigo/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-sl-indigo" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-sl-text-dark">{totalProducts}</div>
                    <p className="text-xs text-sl-text-mid mt-1.5 font-medium">Active listings</p>
                </div>

                {/* Low Stock */}
                <div className="bg-sl-bg-card rounded-2xl p-6 border-l-[5px] border-amber-500 shadow-sm border border-sl-border relative overflow-hidden group">
                    <AlertTriangle className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[13px] font-semibold text-sl-text-mid uppercase tracking-wider">
                            Low Stock Alerts
                        </h3>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-amber-600">{lowStockCount}</div>
                    <p className="text-xs text-amber-600 mt-1.5 font-medium">Requires attention</p>
                </div>

                {/* Orders */}
                <div className="bg-sl-bg-card rounded-2xl p-6 border-l-[5px] border-sl-emerald shadow-sm border border-sl-border relative overflow-hidden group">
                    <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-sl-emerald opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[13px] font-semibold text-sl-text-mid uppercase tracking-wider">
                            Total Orders
                        </h3>
                        <div className="w-8 h-8 rounded-lg bg-sl-emerald/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-sl-emerald" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-sl-text-dark">
                        {isLoadingOrders ? "-" : totalOrders}
                    </div>
                    <p className="text-xs text-sl-text-mid mt-1.5 font-medium">Total received orders</p>
                </div>
            </div>

            <div className="mt-10">
                <h3 className="text-[18px] font-bold text-sl-text-dark mb-4 tracking-tight">
                    Recent Orders
                </h3>
                <div className="bg-sl-bg-card rounded-2xl shadow-sm border border-sl-border overflow-hidden">
                    <table className="w-full text-[13.5px] text-left">
                        <thead className="bg-sl-bg border-b border-sl-border text-sl-text-mid">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Order ID</th>
                                <th className="px-6 py-4 font-semibold">Items</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sl-border">
                            {isLoadingOrders ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sl-text-mid">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sl-text-mid">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order: any) => {
                                    const sellerItemCount = order.items.length;
                                    return (
                                        <tr key={order.id} className="hover:bg-sl-bg/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-sl-text-dark truncate max-w-[150px]">
                                                {order.id}
                                            </td>
                                            <td className="px-6 py-4 text-sl-text-mid">
                                                {sellerItemCount} item(s)
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                                                    order.status === "completed" || order.status === "confirmed" ? "bg-sl-emerald/10 text-sl-emerald" :
                                                    order.status === "placed" ? "bg-amber-100 text-amber-700" :
                                                    "bg-sl-border text-sl-text-mid"
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sl-text-mid font-medium">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

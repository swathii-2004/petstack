import React, { useEffect, useState } from "react";
import { getUserOrders } from "../../api/orders";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getUserOrders(1);
            setOrders(data.items);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading orders...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 mt-10">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>
            {orders.length === 0 ? (
                <p className="text-gray-500">You haven't placed any orders yet.</p>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order._id} className="border rounded-lg p-6 bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-4 border-b pb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Order ID: {order._id}</p>
                                    <p className="text-sm text-gray-500">Placed on: {new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold capitalize">
                                        {order.status}
                                    </span>
                                    <p className="font-bold mt-2">Total: ${order.total_amount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                                        )}
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity} | ${item.price.toFixed(2)} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {order.tracking_number && (
                                <div className="mt-4 pt-4 border-t text-sm">
                                    <span className="font-semibold">Tracking Number:</span> {order.tracking_number}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

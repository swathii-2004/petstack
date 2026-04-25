import React, { useEffect, useState } from "react";
import { getSellerOrders, updateOrderStatus } from "../api/orders";
import { Button } from "../components/ui/button";
import toast from "react-hot-toast";

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getSellerOrders(1, filter);
            setOrders(data.items);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, status: string) => {
        let trackingNumber;
        if (status === "shipped") {
            trackingNumber = prompt("Enter tracking number (optional):");
        }
        
        try {
            await updateOrderStatus(orderId, status, trackingNumber || undefined);
            toast.success(`Order marked as ${status}`);
            fetchOrders();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>
            
            <div className="flex gap-2 mb-6">
                {['all', 'placed', 'confirmed', 'processing', 'shipped', 'delivered'].map(status => (
                    <button
                        key={status}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                            filter === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setFilter(status)}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {loading ? (
                <div>Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-center text-gray-500 py-10 border rounded-lg bg-gray-50">
                    No orders found for this status.
                </div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium text-gray-600">Order ID</th>
                                <th className="p-4 font-medium text-gray-600">Date</th>
                                <th className="p-4 font-medium text-gray-600">Total</th>
                                <th className="p-4 font-medium text-gray-600">Status</th>
                                <th className="p-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td className="p-4 font-mono text-xs">{order._id.slice(-8)}</td>
                                    <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">${order.total_amount.toFixed(2)}</td>
                                    <td className="p-4 capitalize">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold">
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        {order.status === 'confirmed' && (
                                            <Button size="sm" onClick={() => handleStatusUpdate(order._id, 'processing')}>
                                                Process
                                            </Button>
                                        )}
                                        {order.status === 'processing' && (
                                            <Button size="sm" onClick={() => handleStatusUpdate(order._id, 'shipped')}>
                                                Ship
                                            </Button>
                                        )}
                                        {order.status === 'shipped' && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(order._id, 'delivered')}>
                                                Mark Delivered
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

import { useEffect, useState } from "react";
import { getSellerOrders, updateOrderStatus } from "../api/orders";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Eye, 
  Copy,
  AlertCircle,
  Play,
  ArrowRight,
  ClipboardCheck,
  Search,
  ExternalLink
} from "lucide-react";

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getSellerOrders(1, filter);
            setOrders(data.items || []);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to fetch order history");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, status: string) => {
        let trackingNumber = undefined;
        if (status === "shipped") {
            const track = prompt("Enter courier/tracking number (optional):");
            if (track === null) return; // Cancelled
            trackingNumber = track;
        }
        
        try {
            await updateOrderStatus(orderId, status, trackingNumber || undefined);
            toast.success(`Order status successfully updated to ${status}`);
            fetchOrders();
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder((prev: any) => ({
                    ...prev,
                    status,
                    tracking_number: trackingNumber || prev.tracking_number
                }));
            }
        } catch (error) {
            toast.error("Failed to update order status");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Order ID copied to clipboard!");
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "placed":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "confirmed":
                return "bg-purple-50 text-purple-700 border-purple-200";
            case "processing":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "shipped":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "delivered":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Orders</h1>
                    <p className="text-gray-500 mt-1 text-sm">Fulfill customer purchases, update delivery details, and track payout releases.</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b pb-4 border-gray-200">
                {['all', 'placed', 'confirmed', 'processing', 'shipped', 'delivered'].map(status => (
                    <button
                        key={status}
                        className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide capitalize border transition-all ${
                            filter === status 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                            setFilter(status);
                            setSelectedOrder(null);
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Orders List Table Card */}
                <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${selectedOrder ? "lg:col-span-7" : "lg:col-span-12"}`}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-3">
                            <span className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></span>
                            <p className="text-gray-500 text-sm font-medium">Loading orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center text-gray-500 py-16 px-6">
                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <h3 className="font-semibold text-gray-900 text-base">No orders found</h3>
                            <p className="text-sm text-gray-400 mt-1">There are no customer purchases matching the "{filter}" filter.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Product</th>
                                        <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                                        <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                                        <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                                        <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map(order => (
                                        <tr 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)}
                                            className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${
                                                selectedOrder?.id === order.id ? "bg-indigo-50/20" : ""
                                            }`}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2.5">
                                                    {order.items?.[0]?.image_url ? (
                                                        <img
                                                            src={order.items[0].image_url}
                                                            alt={order.items[0].name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                                                            <Package className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">
                                                            {order.items?.[0]?.name || "Order"}
                                                        </p>
                                                        {order.items?.length > 1 && (
                                                            <p className="text-2xs text-gray-400">+{order.items.length - 1} more</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600 font-medium">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-bold text-gray-900">
                                                ${order.total_amount.toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 border rounded-full text-2xs font-bold uppercase tracking-wider inline-block ${getStatusStyle(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4 space-x-2 text-right" onClick={(e) => e.stopPropagation()}>
                                                {order.status === 'placed' && (
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs" 
                                                        onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                                                    >
                                                        Accept & Confirm
                                                    </Button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs" 
                                                        onClick={() => handleStatusUpdate(order.id, 'processing')}
                                                    >
                                                        Process Package
                                                    </Button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1" 
                                                        onClick={() => handleStatusUpdate(order.id, 'shipped')}
                                                    >
                                                        <Truck className="w-3.5 h-3.5" /> Ship
                                                    </Button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold text-xs flex items-center gap-1" 
                                                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Fulfill (COD/Delivered)
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

                {/* Selected Order Detail Sidebar Panel */}
                {selectedOrder && (
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 sticky top-8 animate-in fade-in slide-in-from-right-4 duration-200">
                        <div className="flex justify-between items-start border-b pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-gray-900">Order Detail</h2>
                                    <button 
                                        onClick={() => copyToClipboard(selectedOrder.id)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-colors"
                                        title="Copy Full ID"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="font-mono text-2xs text-gray-400 mt-0.5">{selectedOrder.id}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)} 
                                className="text-gray-400 hover:text-gray-900 font-bold text-lg"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Order Status Action Banner */}
                        <div className="bg-gray-50 border p-4 rounded-xl space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">Current Status</span>
                                <span className={`px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-wider ${getStatusStyle(selectedOrder.status)}`}>
                                    {selectedOrder.status}
                                </span>
                            </div>
                            
                            {/* Action description & Trigger */}
                            <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-4">
                                <p className="text-2xs text-gray-500 leading-relaxed font-medium">
                                    {selectedOrder.status === 'placed' && "Click Accept to confirm the customer purchase and reserve inventory."}
                                    {selectedOrder.status === 'confirmed' && "Start processing the order to package items for transit."}
                                    {selectedOrder.status === 'processing' && "Ready to hand over to courier? Input tracking details and mark as shipped."}
                                    {selectedOrder.status === 'shipped' && "Mark delivered once package has reached the customer address successfully."}
                                    {selectedOrder.status === 'delivered' && "Fulfillment complete. Funds released to payout balance."}
                                </p>
                                
                                <div className="shrink-0">
                                    {selectedOrder.status === 'placed' && (
                                        <Button size="sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'confirmed')}>Accept</Button>
                                    )}
                                    {selectedOrder.status === 'confirmed' && (
                                        <Button size="sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}>Process</Button>
                                    )}
                                    {selectedOrder.status === 'processing' && (
                                        <Button size="sm" onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped')}>Ship</Button>
                                    )}
                                    {selectedOrder.status === 'shipped' && (
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}>Deliver</Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items list */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider text-gray-500">Ordered Items</h3>
                            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                                {selectedOrder.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex py-3 gap-3 justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-lg border" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-2xs text-gray-400 border">No Img</div>
                                            )}
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                                                <span className="text-xs text-gray-400">Qty: {item.quantity} · ${item.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-gray-900 text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer Address Details */}
                        <div className="space-y-2 border-t pt-4 text-xs">
                            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider text-gray-500">Fulfillment Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400 font-medium block">Delivery Destination</span>
                                    <p className="text-gray-700 font-semibold mt-1 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {selectedOrder.delivery_address}
                                    </p>
                                </div>
                                {selectedOrder.tracking_number && (
                                    <div>
                                        <span className="text-gray-400 font-medium block">Tracking Reference</span>
                                        <p className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded font-semibold mt-1 inline-block">
                                            {selectedOrder.tracking_number}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

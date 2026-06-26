import { useEffect, useState } from "react";
import { getUserOrders } from "../../api/orders";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  HelpCircle, 
  FileText,
  Calendar,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";

// Steps definition for timeline
const ORDER_STEPS = [
  { status: "placed", label: "Order Placed", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "processing", label: "Processing", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 }
];

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getUserOrders(1);
            setOrders(data.items || []);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to load your orders");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIndex = (status: string) => {
        return ORDER_STEPS.findIndex(step => step.status === status);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Order ID copied to clipboard!");
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-ps-cream flex flex-col items-center justify-center p-6">
                <span className="inline-block w-8 h-8 border-4 border-ps-green/20 border-t-ps-green rounded-full animate-spin mb-4"></span>
                <p className="text-ps-text-mid font-medium text-sm">Loading your order history...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ps-cream py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-sans text-ps-dark">My Orders</h1>
                    <p className="text-ps-text-mid text-sm mt-1">Track status, download prescriptions, and manage order history.</p>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-ps-cream-2 p-12 text-center shadow-sm space-y-4">
                        <div className="w-16 h-16 bg-ps-cream rounded-full flex items-center justify-center mx-auto text-ps-green">
                            <ShoppingBagIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-ps-dark">No orders yet</h3>
                            <p className="text-sm text-ps-text-mid mt-1">When you buy products from our pet shop, they'll appear here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => {
                            const orderId = order.id || order._id || "";
                            const currentStatusIdx = getStatusIndex(order.status);
                            const isExpanded = expandedOrder === orderId;

                            return (
                                <div 
                                    key={orderId} 
                                    className="bg-white rounded-2xl border border-ps-cream-2 shadow-sm overflow-hidden transition-all hover:shadow-md"
                                >
                                    {/* Order Brief Header */}
                                    <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50 border-b border-gray-100">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-ps-text-mid font-medium uppercase tracking-wider">Order Reference</span>
                                                <button 
                                                    onClick={() => copyToClipboard(orderId)}
                                                    className="p-1 hover:bg-gray-200/50 rounded text-gray-400 hover:text-ps-dark transition-colors"
                                                    title="Copy Order ID"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="font-mono text-sm font-semibold text-ps-dark tracking-tight">{orderId}</p>
                                        </div>

                                        <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-8 text-sm">
                                            <div className="space-y-0.5">
                                                <span className="text-xs text-ps-text-mid font-medium block">Date Placed</span>
                                                <span className="font-medium text-ps-dark flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-ps-green" />
                                                    {new Date(order.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-xs text-ps-text-mid font-medium block">Total Amount</span>
                                                <span className="font-bold text-ps-dark text-base">₹{order.total_amount.toFixed(2)}</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-xs text-ps-text-mid font-medium block">Payment Method</span>
                                                <span className="capitalize text-xs font-semibold px-2 py-0.5 bg-ps-green-pale text-ps-green border border-ps-green/10 rounded-full inline-block">
                                                    {order.payment_method === 'stripe' ? 'Stripe (Online)' : 'COD'}
                                                </span>
                                            </div>
                                            {order.invoice_url && (
                                                <div className="space-y-0.5">
                                                    <span className="text-xs text-ps-text-mid font-medium block">Invoice</span>
                                                    <a 
                                                        href={order.invoice_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-ps-green hover:underline"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        Download PDF
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Premium Timeline Stepper */}
                                    <div className="px-6 py-8 border-b border-gray-100 bg-white">
                                        <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                                            {/* Progress connecting line */}
                                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 -z-10 rounded-full">
                                                <div 
                                                    className="h-full bg-ps-green transition-all duration-500 rounded-full"
                                                    style={{ 
                                                        width: `${Math.max(0, (currentStatusIdx / (ORDER_STEPS.length - 1)) * 100)}%` 
                                                    }}
                                                ></div>
                                            </div>

                                            {ORDER_STEPS.map((step, idx) => {
                                                const StepIcon = step.icon;
                                                const isCompleted = idx < currentStatusIdx;
                                                const isActive = idx === currentStatusIdx;
                                                const isUpcoming = idx > currentStatusIdx;

                                                return (
                                                    <div key={step.status} className="flex flex-col items-center space-y-2 relative">
                                                        {/* Dot / Icon container */}
                                                        <div 
                                                            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                                                isCompleted 
                                                                ? "bg-ps-green border-ps-green text-white shadow-sm" 
                                                                : isActive 
                                                                ? "bg-white border-ps-green text-ps-green ring-4 ring-ps-green-pale animate-pulse shadow-sm" 
                                                                : "bg-white border-gray-200 text-gray-400"
                                                            }`}
                                                        >
                                                            <StepIcon className="w-4 h-4" />
                                                        </div>
                                                        {/* Step Label */}
                                                        <span 
                                                            className={`text-xs font-semibold whitespace-nowrap text-center ${
                                                                isCompleted || isActive 
                                                                ? "text-ps-dark" 
                                                                : "text-gray-400 font-normal"
                                                            }`}
                                                        >
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Order Details & Items (Collapsible) */}
                                    <div className="bg-white">
                                        <button 
                                            onClick={() => toggleExpand(orderId)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-sm font-semibold text-ps-dark hover:bg-gray-50/50 transition-colors"
                                        >
                                            <span className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-ps-green" />
                                                {isExpanded ? "Hide Order Items" : `Show Order Items (${order.items.length})`}
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-ps-text-mid" /> : <ChevronDown className="w-4 h-4 text-ps-text-mid" />}
                                        </button>

                                        {isExpanded && (
                                            <div className="px-6 pb-6 pt-2 divide-y divide-gray-100 border-t border-gray-50 space-y-4">
                                                {/* Items */}
                                                <div className="space-y-4 pt-4">
                                                    {order.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex gap-4 items-center justify-between">
                                                            <div className="flex gap-3 items-center">
                                                                {item.image_url ? (
                                                                    <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-xl border border-gray-100" />
                                                                ) : (
                                                                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-xs text-gray-400 border">No Image</div>
                                                                )}
                                                                <div>
                                                                    <p className="font-semibold text-ps-dark text-sm">{item.name}</p>
                                                                    <p className="text-xs text-ps-text-mid">Price: ₹{item.price.toFixed(2)} each</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-ps-dark">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                                <p className="text-xs text-ps-text-mid">Qty: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Delivery Info & Tracking */}
                                                <div className="pt-4 grid md:grid-cols-3 gap-6 text-sm">
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-ps-dark flex items-center gap-1.5">
                                                            <MapPin className="w-4 h-4 text-ps-green" /> Delivery Address
                                                        </h4>
                                                        <p className="text-xs text-ps-text-mid bg-gray-50 p-3 rounded-xl border border-gray-100/50 leading-relaxed">
                                                            {order.delivery_address}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-ps-dark flex items-center gap-1.5">
                                                            <Truck className="w-4 h-4 text-ps-green" /> Shipping & Tracking
                                                        </h4>
                                                        {order.tracking_number ? (
                                                            <div className="bg-ps-green-pale/30 border border-ps-green/10 p-3.5 rounded-xl space-y-1.5">
                                                                <span className="text-xs text-ps-text-mid font-medium block">Tracking ID</span>
                                                                <p className="font-mono text-sm font-semibold text-ps-green tracking-tight">{order.tracking_number}</p>
                                                                <span className="text-2xs text-ps-green bg-ps-green-pale px-2 py-0.5 rounded-full inline-block font-semibold mt-1">Shipped via Standard Carrier</span>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-gray-50 border border-dashed border-gray-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-ps-text-mid">
                                                                <AlertCircle className="w-4 h-4 text-ps-text-mid shrink-0" />
                                                                <div>
                                                                    <p className="font-medium text-ps-dark">Fulfillment pending</p>
                                                                    <p className="mt-0.5">The seller is preparing your package. A tracking number will appear here once shipped.</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-ps-dark flex items-center gap-1.5">
                                                            <FileText className="w-4 h-4 text-ps-green" /> Invoice Documents
                                                        </h4>
                                                        {order.invoice_url ? (
                                                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2.5">
                                                                <p className="text-xs text-ps-text-mid">Official receipt/invoice for your order items.</p>
                                                                <a 
                                                                    href={order.invoice_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-ps-green text-white hover:bg-ps-green/90 text-xs font-semibold rounded-xl transition-colors shadow-sm"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    Download PDF Invoice
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-gray-50 border border-dashed border-gray-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-ps-text-mid">
                                                                <AlertCircle className="w-4 h-4 text-ps-text-mid shrink-0" />
                                                                <div>
                                                                    <p className="font-medium text-ps-dark">Invoice unavailable</p>
                                                                    <p className="mt-0.5">This order might not have generated an invoice yet (e.g. if payment is pending).</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple fallback helper component forShoppingBag
function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

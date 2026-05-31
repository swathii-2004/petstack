import { useState, useEffect } from "react";
import { useCartStore } from "../../store/cartStore";
import { useNavigate, Link } from "react-router-dom";
import { createOrder } from "../../api/orders";
import { toast } from "sonner";
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  ShoppingBag, 
  Lock, 
  Check, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "../../components/ui/button";

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCartStore();
    const navigate = useNavigate();
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("stripe");

    useEffect(() => {
        if (items.length === 0) {
            navigate("/products");
        }
    }, [items, navigate]);

    const handleCheckout = async () => {
        if (!address.trim()) {
            toast.error("Please enter a delivery address");
            return;
        }

        setLoading(true);

        try {
            // 1. Create order on backend
            const orderPayload = {
                delivery_address: address,
                items: items.map(item => ({
                    product_id: item.product._id || (item.product as any).id,
                    seller_id: item.product.seller_id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    image_url: item.product.image_urls?.[0] || ""
                })),
                payment_method: paymentMethod
            };
            
            const orderData = await createOrder(orderPayload);

            if (paymentMethod === "cod") {
                toast.success("Order placed successfully via Cash on Delivery!");
                clearCart();
                navigate("/orders");
                return;
            }

            // 2. Handle Stripe
            if (paymentMethod === "stripe" && orderData.checkout_url) {
                window.location.href = orderData.checkout_url;
            }
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const errorMsg = typeof detail === 'string' ? detail : 
                             (Array.isArray(detail) ? "Invalid order data submitted" : "Checkout failed");
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ps-cream py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Back Link & Header */}
                <div className="mb-8">
                    <Link to="/products" className="inline-flex items-center text-sm font-medium text-ps-text-mid hover:text-ps-dark transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
                    </Link>
                    <div className="flex items-center justify-between mt-4">
                        <h1 className="text-3xl font-bold font-sans text-ps-dark">Secure Checkout</h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Encrypted
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Column - Shipping & Payment */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Address Card */}
                        <div className="bg-white rounded-2xl border border-ps-cream-2 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-ps-green-pale text-ps-green rounded-xl">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-ps-dark">Delivery Address</h2>
                            </div>
                            <p className="text-sm text-ps-text-mid mb-3">Please provide the complete shipping address for accurate pet service delivery.</p>
                            <textarea
                                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ps-green/30 focus:border-ps-green transition-all bg-gray-50/50 text-sm"
                                rows={4}
                                placeholder="House / Flat No, Street, Landmark, City, State, Pincode..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Payment Selection Card */}
                        <div className="bg-white rounded-2xl border border-ps-cream-2 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-ps-green-pale text-ps-green rounded-xl">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-semibold text-ps-dark">Payment Method</h2>
                            </div>
                            
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Stripe Payment Card */}
                                <div 
                                    onClick={() => setPaymentMethod("stripe")}
                                    className={`relative cursor-pointer rounded-xl border p-4 flex flex-col justify-between h-32 transition-all select-none ${
                                        paymentMethod === "stripe" 
                                        ? "border-ps-green bg-ps-green/5 ring-1 ring-ps-green" 
                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <CreditCard className={`w-6 h-6 ${paymentMethod === "stripe" ? "text-ps-green" : "text-gray-400"}`} />
                                        {paymentMethod === "stripe" && (
                                            <div className="bg-ps-green text-white p-0.5 rounded-full">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-ps-dark text-sm">Pay Online (Stripe)</h3>
                                        <p className="text-xs text-ps-text-mid mt-1">Credit/Debit Cards, secure transaction.</p>
                                    </div>
                                </div>

                                {/* COD Payment Card */}
                                <div 
                                    onClick={() => setPaymentMethod("cod")}
                                    className={`relative cursor-pointer rounded-xl border p-4 flex flex-col justify-between h-32 transition-all select-none ${
                                        paymentMethod === "cod" 
                                        ? "border-ps-green bg-ps-green/5 ring-1 ring-ps-green" 
                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <Truck className={`w-6 h-6 ${paymentMethod === "cod" ? "text-ps-green" : "text-gray-400"}`} />
                                        {paymentMethod === "cod" && (
                                            <div className="bg-ps-green text-white p-0.5 rounded-full">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-ps-dark text-sm">Cash on Delivery (COD)</h3>
                                        <p className="text-xs text-ps-text-mid mt-1">Pay with cash when items are delivered.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-2xl border border-ps-cream-2 p-6 shadow-sm sticky top-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-ps-green" />
                                <h2 className="text-xl font-semibold text-ps-dark">Order Summary</h2>
                            </div>

                            {/* Cart Items List */}
                            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-2 space-y-3">
                                {items.map(item => {
                                    const productId = item.product._id || (item.product as any).id;
                                    return (
                                        <div key={productId} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {item.product.image_urls?.[0] ? (
                                                    <img src={item.product.image_urls[0]} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                )}
                                                <div>
                                                    <h4 className="font-semibold text-ps-dark text-sm line-clamp-1">{item.product.name}</h4>
                                                    <span className="text-xs text-ps-text-mid">Qty: {item.quantity} · ${item.product.price.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-ps-dark text-sm">${(item.quantity * item.product.price).toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Prices calculation */}
                            <div className="border-t border-gray-100 pt-4 space-y-2.5">
                                <div className="flex justify-between text-sm text-ps-text-mid">
                                    <span>Subtotal</span>
                                    <span>${cartTotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-ps-text-mid">
                                    <span>Shipping</span>
                                    <span className="text-emerald-600 font-semibold">Free</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-xl text-ps-dark">
                                    <span>Total:</span>
                                    <span>${cartTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Complete Order CTA Button */}
                            <button
                                className={`w-full h-13 rounded-xl font-semibold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                                    paymentMethod === "cod"
                                    ? "bg-ps-green hover:bg-ps-green/90 shadow-ps-green/10"
                                    : "bg-ps-dark hover:bg-ps-darker shadow-ps-dark/10"
                                } disabled:opacity-50 disabled:pointer-events-none`}
                                onClick={handleCheckout}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : paymentMethod === "cod" ? (
                                    <>
                                        <Truck className="w-5 h-5" /> Book Order (COD)
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" /> Pay Online with Stripe
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-xs text-ps-text-mid mt-4">
                                <Lock className="w-3.5 h-3.5" /> Security Guranteed. Payments powered by Stripe.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

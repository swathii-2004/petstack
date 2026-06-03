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
  ShieldCheck,
  Edit2
} from "lucide-react";

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCartStore();
    const navigate = useNavigate();
    
    // Wizard step state
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("stripe");

    // Address fields state
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");
    const [saveAsDefault, setSaveAsDefault] = useState(true);

    useEffect(() => {
        if (items.length === 0) {
            navigate("/products");
        }
    }, [items, navigate]);

    // Load default address from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("ps_default_address");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFullName(parsed.fullName || "");
                setPhone(parsed.phone || "");
                setStreet(parsed.street || "");
                setCity(parsed.city || "");
                setState(parsed.state || "");
                setPincode(parsed.pincode || "");
            } catch {
                // fallback if saved format was a plain text string
                setStreet(saved);
            }
        }
    }, []);

    const handleProceedToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) return toast.error("Please enter your full name");
        if (!phone.trim()) return toast.error("Please enter your phone number");
        if (!street.trim()) return toast.error("Please enter your street address");
        if (!city.trim()) return toast.error("Please enter your city");
        if (!state.trim()) return toast.error("Please enter your state");
        if (!pincode.trim()) return toast.error("Please enter your pincode");

        if (saveAsDefault) {
            localStorage.setItem("ps_default_address", JSON.stringify({
                fullName,
                phone,
                street,
                city,
                state,
                pincode
            }));
        } else {
            localStorage.removeItem("ps_default_address");
        }

        setStep(2);
    };

    const handleCheckout = async () => {
        setLoading(true);

        const formattedAddress = `${fullName}, Phone: ${phone}, ${street}, ${city}, ${state} - ${pincode}`;

        try {
            // 1. Create order on backend
            const orderPayload = {
                delivery_address: formattedAddress,
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
                <div className="mb-6">
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

                {/* Step Progress Bar */}
                <div className="flex items-center justify-center gap-4 mb-8 max-w-xs mx-auto">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            step === 1 ? "bg-ps-green text-white" : "bg-ps-green-pale text-ps-green"
                        }`}>1</div>
                        <span className={`text-sm font-semibold ${step === 1 ? "text-ps-dark" : "text-ps-text-mid"}`}>Shipping</span>
                    </div>
                    <div className="h-[2px] w-8 bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            step === 2 ? "bg-ps-green text-white" : "bg-gray-200 text-gray-400"
                        }`}>2</div>
                        <span className={`text-sm font-semibold ${step === 2 ? "text-ps-dark" : "text-ps-text-mid"}`}>Payment</span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Column - Form Wizard Steps */}
                    <div className="lg:col-span-7 space-y-6">
                        {step === 1 ? (
                            /* STEP 1: Address Details Form */
                            <div className="bg-white rounded-2xl border border-ps-cream-2 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-ps-green-pale text-ps-green rounded-xl">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-ps-dark">Shipping Address</h2>
                                </div>
                                <p className="text-xs text-ps-text-mid mb-5">Please enter the details where your pet products should be delivered.</p>
                                
                                <form onSubmit={handleProceedToPayment} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                                                placeholder="e.g. John Doe"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                                                placeholder="e.g. 555-0199"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode / ZIP *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                                                placeholder="e.g. 560001"
                                                value={pincode}
                                                onChange={e => setPincode(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                                                placeholder="e.g. Flat 402, Green Meadows, 5th Main"
                                                value={street}
                                                onChange={e => setStreet(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">City *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                                                placeholder="e.g. Bangalore"
                                                value={city}
                                                onChange={e => setCity(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">State *</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-ps-green outline-none"
                                                placeholder="e.g. Karnataka"
                                                value={state}
                                                onChange={e => setState(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="save_as_default"
                                            className="w-4 h-4 rounded text-ps-green focus:ring-ps-green border-gray-300"
                                            checked={saveAsDefault}
                                            onChange={e => setSaveAsDefault(e.target.checked)}
                                        />
                                        <label htmlFor="save_as_default" className="text-xs text-gray-600 select-none">
                                            Save this as my default shipping address
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full h-12 mt-4 bg-ps-dark text-white rounded-xl font-semibold hover:bg-ps-darker flex items-center justify-center gap-1.5 shadow-md transition-all text-sm"
                                    >
                                        Proceed to Payment Method <ChevronRight className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            /* STEP 2: Payment Method & Review */
                            <div className="space-y-6">
                                {/* Address details read-only card */}
                                <div className="bg-white rounded-2xl border border-ps-cream-2 p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-3.5">
                                        <h3 className="font-semibold text-ps-dark text-sm flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-ps-green" /> Delivery Details
                                        </h3>
                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-xs text-ps-green hover:underline font-semibold flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3" /> Change
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-600 bg-gray-50/50 p-4 border rounded-xl space-y-1.5">
                                        <p className="font-semibold text-gray-800">{fullName}</p>
                                        <p>{street}</p>
                                        <p>{city}, {state} - {pincode}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">Ph: {phone}</p>
                                    </div>
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
                        )}
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
                            {step === 2 && (
                                <div className="space-y-3 animate-fade-in">
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
                                    
                                    <button
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        className="w-full text-center text-xs text-gray-500 hover:text-ps-dark transition font-semibold"
                                    >
                                        Back to Shipping Info
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-center gap-1.5 text-[10px] text-ps-text-mid mt-4">
                                <Lock className="w-3.5 h-3.5" /> Security Guaranteed. Payments powered by Stripe.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

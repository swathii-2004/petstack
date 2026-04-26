import React, { useState, useEffect } from "react";
import { useCartStore } from "../../store/cartStore";
import { useNavigate } from "react-router-dom";
import { createOrder, verifyPayment, createRazorpayOrder, verifyRazorpay } from "../../api/orders";
import { toast } from "sonner";

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

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleCheckout = async () => {
        if (!address) {
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
                return;
            }

            // 3. Handle Razorpay
            if (paymentMethod === "razorpay") {
                const rzOrder = await createRazorpayOrder({ order_id: orderData.order_id });
                
                const options = {
                    key: rzOrder.key,
                    amount: rzOrder.amount,
                    currency: rzOrder.currency,
                    name: "PetStack",
                    description: "Order Payment",
                    order_id: rzOrder.razorpay_order_id,
                    handler: async function (response: any) {
                        try {
                            setLoading(true);
                            await verifyRazorpay({
                                petstack_order_id: orderData.order_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            toast.success("Payment successful!");
                            clearCart();
                            navigate("/orders");
                        } catch (err: any) {
                            toast.error("Payment verification failed");
                            setLoading(false);
                        }
                    },
                    prefill: {
                        name: "PetStack User",
                        email: "user@petstack.com",
                        contact: "9999999999"
                    },
                    theme: {
                        color: "#4f46e5"
                    }
                };
                
                const rzp = new (window as any).Razorpay(options);
                rzp.on("payment.failed", function (response: any) {
                    toast.error(response.error.description);
                    setLoading(false);
                });
                rzp.open();
                return;
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
        <div className="max-w-3xl mx-auto p-6 mt-10">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                    <textarea
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-500"
                        rows={4}
                        placeholder="Enter your full address..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    ></textarea>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-4 mb-6">
                        {items.map(item => {
                            const productId = item.product._id || (item.product as any).id;
                            return (
                            <div key={productId} className="flex justify-between">
                                <span>{item.quantity} x {item.product.name}</span>
                                <span>${(item.quantity * item.product.price).toFixed(2)}</span>
                            </div>
                        )})}
                    </div>
                    <div className="border-t pt-4 flex justify-between font-bold text-xl mb-6">
                        <span>Total:</span>
                        <span>${cartTotal().toFixed(2)}</span>
                    </div>
                    <button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded font-semibold disabled:opacity-50"
                        onClick={handleCheckout}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Pay Now"}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="stripe" 
                                checked={paymentMethod === "stripe"} 
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="form-radio h-5 w-5 text-indigo-600"
                            />
                            <span>Pay Online (Stripe)</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="cod" 
                                checked={paymentMethod === "cod"} 
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="form-radio h-5 w-5 text-indigo-600"
                            />
                            <span>Cash on Delivery (COD)</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="razorpay" 
                                checked={paymentMethod === "razorpay"} 
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="form-radio h-5 w-5 text-indigo-600"
                            />
                            <span>Pay with Razorpay (India Only)</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

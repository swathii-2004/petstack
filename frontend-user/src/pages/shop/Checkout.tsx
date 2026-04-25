import React, { useState, useEffect } from "react";
import { useCartStore } from "../../store/cartStore";
import { useNavigate } from "react-router-dom";
import { createOrder, verifyPayment } from "../../api/orders";
import toast from "react-hot-toast";

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCartStore();
    const navigate = useNavigate();
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (items.length === 0) {
            navigate("/products");
        }
        
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        
        return () => {
            document.body.removeChild(script);
        };
    }, [items, navigate]);

    const handleCheckout = async () => {
        if (!address) {
            toast.error("Please enter a delivery address");
            return;
        }

        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        
        if (!razorpayKey || razorpayKey === "rzp_test_placeholder") {
            toast.error("Payment gateway not configured yet");
            return;
        }

        setLoading(true);
        try {
            // 1. Create order on backend
            const orderPayload = {
                delivery_address: address,
                items: items.map(item => ({
                    product_id: item.product._id,
                    seller_id: item.product.seller_id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    image_url: item.product.image_urls?.[0] || ""
                }))
            };
            
            const orderData = await createOrder(orderPayload);

            // 2. Open Razorpay Checkout
            const options = {
                key: razorpayKey,
                amount: orderData.amount,
                currency: "INR",
                name: "PetStack",
                description: "Order Payment",
                order_id: orderData.razorpay_order_id,
                handler: async function (response: any) {
                    try {
                        await verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: orderData.order_id
                        });
                        toast.success("Payment successful! Order confirmed.");
                        clearCart();
                        navigate("/orders");
                    } catch (error) {
                        toast.error("Payment verification failed");
                    }
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Checkout failed");
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
                        {items.map(item => (
                            <div key={item.product._id} className="flex justify-between">
                                <span>{item.quantity} x {item.product.name}</span>
                                <span>${(item.quantity * item.product.price).toFixed(2)}</span>
                            </div>
                        ))}
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
            </div>
        </div>
    );
}

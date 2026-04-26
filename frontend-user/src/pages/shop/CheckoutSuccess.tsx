import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyStripe } from "../../api/orders";
import { useCartStore } from "../../store/cartStore";

export default function CheckoutSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCartStore();
    
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    
    useEffect(() => {
        const sessionId = searchParams.get("session_id");
        const orderId = searchParams.get("order_id");
        
        if (!sessionId || !orderId) {
            setStatus("error");
            return;
        }
        
        verifyStripe({ session_id: sessionId, order_id: orderId })
            .then(() => {
                setStatus("success");
                clearCart();
            })
            .catch(() => {
                setStatus("error");
            });
    }, [searchParams, clearCart]);
    
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
                {status === "loading" && (
                    <div className="py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-700">Verifying your payment...</h2>
                        <p className="text-gray-500 mt-2">Please don't close this window.</p>
                    </div>
                )}
                
                {status === "success" && (
                    <div className="py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-8">Your order has been confirmed and is being processed.</p>
                        
                        <div className="space-y-3">
                            <Link to="/orders" className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
                                View My Orders
                            </Link>
                            <Link to="/products" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}
                
                {status === "error" && (
                    <div className="py-8">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-8">We couldn't verify your payment. If you were charged, please contact support.</p>
                        
                        <Link to="/checkout" className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
                            Try Again
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

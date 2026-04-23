import { useCartStore } from "../../store/cartStore";
import { Button } from "../ui/button";
import { X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CartDrawer() {
    const { isDrawerOpen, setDrawerOpen, items, removeItem, updateQuantity, cartTotal, clearCart } = useCartStore();
    const navigate = useNavigate();

    if (!isDrawerOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => setDrawerOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl flex flex-col transform transition-transform duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold">Your Cart</h2>
                    <button onClick={() => setDrawerOpen(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            <p>Your cart is empty.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setDrawerOpen(false)}>Continue Shopping</Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.product._id} className="flex gap-4 border-b pb-4">
                                {item.product.image_urls.length > 0 ? (
                                    <img src={item.product.image_urls[0]} alt={item.product.name} className="w-20 h-20 object-cover rounded border" />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-400">No img</div>
                                )}

                                <div className="flex-1">
                                    <h3 className="font-medium text-sm line-clamp-2">{item.product.name}</h3>
                                    <div className="text-indigo-600 font-semibold mt-1">${item.product.price.toFixed(2)}</div>

                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center border rounded">
                                            <button
                                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="px-2 py-1 text-sm">{item.quantity}</span>
                                            <button
                                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                                disabled={item.quantity >= item.product.stock}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            className="text-xs text-red-500 hover:underline"
                                            onClick={() => removeItem(item.product._id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-gray-600">Subtotal</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">${cartTotal().toFixed(2)}</span>
                        </div>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
                            onClick={() => {
                                setDrawerOpen(false);
                                navigate("/checkout");
                                toast?.success?.("Checkout coming in Phase 4");
                            }}
                        >
                            Proceed to Checkout
                        </Button>
                        <div className="text-center mt-3">
                            <button onClick={clearCart} className="text-xs text-gray-500 hover:text-red-500">
                                Clear Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

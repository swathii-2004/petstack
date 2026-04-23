import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { useCartStore } from "../../store/cartStore";
import { Button } from "../../components/ui/button";
import { ShoppingCart, Star, ArrowLeft } from "lucide-react";

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [qty, setQty] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const addItem = useCartStore((state) => state.addItem);

    const { data: product, isLoading: productLoading } = useQuery({
        queryKey: ["product", id],
        queryFn: () => productsApi.getProduct(id!),
        enabled: !!id,
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ["reviews", id],
        queryFn: () => productsApi.getProductReviews(id!),
        enabled: !!id,
    });

    if (productLoading) {
        return <div className="p-20 text-center text-gray-500">Loading product...</div>;
    }

    if (!product) {
        return <div className="p-20 text-center text-red-500">Product not found.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Link to="/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Shop
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border">
                        {product.image_urls.length > 0 ? (
                            <img src={product.image_urls[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <span>No Image</span>
                            </div>
                        )}
                    </div>
                    {product.image_urls.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {product.image_urls.map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`w-20 h-20 flex-shrink-0 border-2 rounded-lg overflow-hidden ${activeImage === i ? "border-indigo-600" : "border-transparent"}`}
                                >
                                    <img src={url} alt={`${product.name} thumbnail ${i}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                                <span className="ml-1 text-sm text-gray-400">({product.review_count} reviews)</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm font-medium capitalize text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">{product.category}</span>
                        </div>
                    </div>

                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6">${product.price.toFixed(2)}</div>

                    <div className="prose prose-sm dark:prose-invert text-gray-600 mb-8 whitespace-pre-wrap">
                        {product.description}
                    </div>

                    <div className="mt-auto border-t pt-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-lg h-12 w-32">
                                <button
                                    className="flex-1 text-gray-500 hover:bg-gray-50 rounded-l-lg hover:text-black font-medium disabled:opacity-50"
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    disabled={qty <= 1}
                                >
                                    -
                                </button>
                                <div className="flex-1 text-center font-semibold">{qty}</div>
                                <button
                                    className="flex-1 text-gray-500 hover:bg-gray-50 rounded-r-lg hover:text-black font-medium disabled:opacity-50"
                                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                                    disabled={qty >= product.stock}
                                >
                                    +
                                </button>
                            </div>

                            <div className="text-sm text-gray-500">
                                {product.stock > 0 ? (
                                    <span className={product.stock < 5 ? "text-amber-600 font-medium" : "text-green-600"}>
                                        {product.stock} items in stock
                                    </span>
                                ) : (
                                    <span className="text-red-500 font-bold">Out of stock</span>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white text-lg gap-2"
                            disabled={product.stock === 0}
                            onClick={() => addItem(product, qty)}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reviews */}
            <div className="mt-20">
                <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
                {reviews.length === 0 ? (
                    <p className="text-gray-500 italic">No reviews yet.</p>
                ) : (
                    <div className="space-y-6">
                        {reviews.map(r => (
                            <div key={r._id} className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-400 fill-current" : "text-gray-200"}`} />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-gray-900">{r.user_name}</span>
                                    <span className="text-sm text-gray-400">· {new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm">{r.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

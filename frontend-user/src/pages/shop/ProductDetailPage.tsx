import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { useCartStore } from "../../store/cartStore";
import { Button } from "../../components/ui/button";
import { ShoppingCart, Star, ArrowLeft, Camera, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [qty, setQty] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const addItem = useCartStore((state) => state.addItem);
    const [selectedSize, setSelectedSize] = useState<string>("M");

    const queryClient = useQueryClient();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        if (selectedImages.length + files.length > 2) {
            toast.error("You can upload a maximum of 2 images.");
            return;
        }
        const newFiles = [...selectedImages, ...files];
        setSelectedImages(newFiles);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    };

    const removeImage = (index: number) => {
        const newFiles = [...selectedImages];
        newFiles.splice(index, 1);
        setSelectedImages(newFiles);
        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!comment.trim()) {
                throw new Error("Please write a comment.");
            }
            return productsApi.submitProductReview(id!, rating, comment, selectedImages);
        },
        onSuccess: () => {
            toast.success("Review submitted successfully!");
            setComment("");
            setRating(5);
            setSelectedImages([]);
            imagePreviews.forEach(p => URL.revokeObjectURL(p));
            setImagePreviews([]);
            queryClient.invalidateQueries({ queryKey: ["reviews", id] });
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["review-eligibility", id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || err.message || "Failed to submit review.");
        }
    });

    const { data: eligibility } = useQuery({
        queryKey: ["review-eligibility", id],
        queryFn: () => productsApi.checkProductReviewEligibility(id!),
        enabled: !!id,
    });

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

    const { data: recommended = { items: [] } } = useQuery({
        queryKey: ["recommended-products", product?.category],
        queryFn: () => productsApi.getProducts({
            category: product?.category,
            limit: 5
        }),
        enabled: !!product?.category,
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
                    <div className="aspect-square bg-white rounded-xl overflow-hidden border p-2 flex items-center justify-center">
                        {product.image_urls.length > 0 ? (
                            <img src={product.image_urls[activeImage]} alt={product.name} className="w-full h-full object-contain" />
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
                                    className={`w-20 h-20 flex-shrink-0 border-2 rounded-lg overflow-hidden p-1 bg-white ${activeImage === i ? "border-ps-green" : "border-transparent"}`}
                                >
                                    <img src={url} alt={`${product.name} thumbnail ${i}`} className="w-full h-full object-contain" />
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
                            <span className="text-sm font-medium capitalize text-ps-green bg-ps-green-pale px-2.5 py-0.5 rounded-full">{product.category}</span>
                        </div>
                    </div>

                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6">₹{product.price.toFixed(2)}</div>

                    <div className="prose prose-sm dark:prose-invert text-gray-600 mb-8 whitespace-pre-wrap">
                        {product.description}
                    </div>

                    {/* Clothing Size Selector */}
                    {product.category.toLowerCase() === "clothing" && (
                        <div className="mb-6 space-y-3">
                            <span className="block text-sm font-semibold text-neutral-textSecondary">
                                Select Size
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"].map((sz) => (
                                    <button
                                        key={sz}
                                        onClick={() => setSelectedSize(sz)}
                                        className={`w-11 h-11 flex items-center justify-center text-xs font-bold rounded-xl border transition-all duration-150 ${
                                            selectedSize === sz
                                                ? "bg-brand-primary text-brand-accent border-brand-primary shadow-hairline-sm scale-105"
                                                : "bg-white text-neutral-textSecondary border-neutral-border hover:bg-neutral-ivory hover:text-neutral-textPrimary"
                                        }`}
                                    >
                                        {sz}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
                            className="w-full h-14 bg-ps-dark hover:bg-ps-darker text-white text-lg gap-2"
                            disabled={product.stock === 0}
                            onClick={() => {
                                addItem(product, qty, product.category.toLowerCase() === "clothing" ? selectedSize : undefined);
                                toast.success("Added to cart!");
                            }}
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
                
                {eligibility?.eligible && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border mb-10">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Share Your Feedback</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="text-yellow-500 hover:scale-110 transition-transform cursor-pointer"
                                        >
                                            <Star className={`w-7 h-7 ${star <= rating ? "fill-current text-yellow-500" : "text-gray-300"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Review</label>
                                <textarea
                                    id="comment"
                                    rows={4}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell us what you think about this product..."
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-ps-green focus:border-transparent bg-white dark:bg-gray-900 text-sm outline-none resize-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Upload Photos (Max 2)
                                </label>
                                <div className="flex flex-wrap gap-4 items-center">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative w-20 h-20 border rounded-lg overflow-hidden group">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {selectedImages.length < 2 && (
                                        <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 cursor-pointer transition-colors">
                                            <Camera className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] font-medium font-sans">Add Photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                            
                            <Button
                                onClick={() => submitMutation.mutate()}
                                disabled={submitMutation.isPending}
                                className="bg-ps-green hover:bg-ps-green-dark text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                            >
                                {submitMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Review"
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {reviews.length === 0 ? (
                    <p className="text-gray-500 italic">No reviews yet.</p>
                ) : (
                    <div className="space-y-6">
                        {reviews.map(r => (
                            <div key={r._id || (r as any).id} className="border-b pb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-400 fill-current" : "text-gray-200"}`} />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-gray-900">{r.user_name}</span>
                                    <span className="text-sm text-gray-400">· {new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{r.comment}</p>
                                {r.image_urls && r.image_urls.length > 0 && (
                                    <div className="flex gap-2">
                                        {r.image_urls.map((url: string, index: number) => (
                                            <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border block hover:opacity-90 transition-opacity">
                                                <img src={url} alt={`Review photo ${index + 1}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recommended Products */}
            {recommended?.items && recommended.items.filter((p: any) => p._id !== id && p.id !== id).length > 0 && (
                <div className="mt-20 border-t pt-10">
                    <h2 className="text-2xl font-bold mb-6">Recommended Products</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {recommended.items
                            .filter((p: any) => p._id !== id && p.id !== id)
                            .slice(0, 4)
                            .map((p: any) => (
                                <div key={p._id || p.id} className="group flex flex-col bg-white dark:bg-gray-900 border rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                                    <Link to={`/products/${p._id || p.id}`} className="aspect-square relative flex-shrink-0 bg-gray-100 overflow-hidden block">
                                        {p.image_urls && p.image_urls.length > 0 ? (
                                            <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                                        )}
                                    </Link>
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="text-[10px] text-ps-green font-bold uppercase tracking-wider mb-1 capitalize">{p.category}</div>
                                        <Link to={`/products/${p._id || p.id}`} className="font-semibold text-ps-dark line-clamp-1 hover:text-ps-green transition-colors text-sm no-underline">
                                            {p.name}
                                        </Link>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="font-bold text-base text-ps-dark">₹{p.price.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

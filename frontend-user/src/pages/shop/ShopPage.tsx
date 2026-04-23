import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useStore } from "zustand";
import { productsApi } from "../../api/products";
import { useCartStore } from "../../store/cartStore";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { ShoppingCart, Star, Select as SelectIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const CATEGORIES = ["all", "food", "grooming", "clothing", "accessories", "other"];

export default function ShopPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ["products", "public", debouncedSearch, category, page],
        queryFn: () => productsApi.getProducts({
            search: debouncedSearch || undefined,
            category: category !== "all" ? category : undefined,
            page,
            limit: 12
        })
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8 md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pet Shop</h1>
                    <p className="text-gray-500 mt-1">Discover products for your furry friends</p>
                </div>
                <div className="flex gap-3">
                    <Input
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-64"
                    />
                    <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                        <SelectTrigger className="w-40 sm:w-48 capitalize">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(c => (
                                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex flex-col space-y-3">
                            <div className="bg-gray-200 dark:bg-gray-800 h-48 rounded-xl w-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            ) : data?.items.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-lg text-gray-500 font-medium">No products found matching your criteria.</p>
                    <Button variant="link" onClick={() => { setSearch(""); setCategory("all"); }}>Clear filters</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {data?.items.map(p => (
                        <div key={p._id} className="group flex flex-col bg-white dark:bg-gray-900 border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <Link to={`/products/${p._id}`} className="aspect-square relative flex-shrink-0 bg-gray-100 overflow-hidden block">
                                {p.image_urls.length > 0 ? (
                                    <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                )}
                                {p.stock === 0 && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                        <span className="bg-gray-900 text-white font-bold px-3 py-1 text-sm rounded-full">Out of Stock</span>
                                    </div>
                                )}
                            </Link>
                            <div className="p-4 flex flex-col flex-1">
                                <div className="text-xs text-indigo-600 font-medium capitalize mb-1">{p.category}</div>
                                <Link to={`/products/${p._id}`} className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-indigo-600 transition-colors">
                                    {p.name}
                                </Link>
                                <div className="mt-auto pt-4 flex items-center justify-between">
                                    <div className="font-bold text-lg">${p.price.toFixed(2)}</div>
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-8 h-8 p-0"
                                        disabled={p.stock === 0}
                                        onClick={() => addItem(p)}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {data && data.pages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                    {Array.from({ length: data.pages }).map((_, i) => (
                        <Button
                            key={i}
                            variant={page === i + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(i + 1)}
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

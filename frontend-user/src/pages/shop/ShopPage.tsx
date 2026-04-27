import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { productsApi } from "../../api/products";
import { useCartStore } from "../../store/cartStore";
import { ShoppingCart } from "lucide-react";

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
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", "public", debouncedSearch, category, page],
    queryFn: () => productsApi.getProducts({
      search: debouncedSearch || undefined,
      category: category !== "all" ? category : undefined,
      page, limit: 12
    })
  });

  return (
    <div className="p-8 font-sans space-y-6">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ps-text-dark">Pet Shop 🛍️</h1>
          <p className="text-ps-text-mid text-[14px] mt-1">Discover premium products for your furry friends</p>
        </div>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-11 px-4 w-64 border border-[#e5e9e0] rounded-xl text-sm bg-white outline-none focus:border-ps-green-light focus:ring-4 focus:ring-[#639922]/10 transition-all placeholder:text-gray-300"
          />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="h-11 px-4 border border-[#e5e9e0] rounded-xl text-sm bg-white text-gray-700 outline-none focus:border-ps-green-light capitalize cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Product Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="bg-[#eef2e8] h-48 rounded-2xl w-full" />
              <div className="h-4 bg-[#eef2e8] rounded w-3/4" />
              <div className="h-4 bg-[#eef2e8] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#C0DD97]">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg text-ps-text-mid font-medium mb-4">No products found matching your criteria.</p>
          <button onClick={() => { setSearch(""); setCategory("all"); }}
            className="px-5 py-2.5 bg-ps-green text-white rounded-xl text-[14px] font-semibold hover:bg-[#27500A] transition-colors">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.items.map(p => (
            <div key={p._id} className="group flex flex-col bg-white border border-[#eef2e8] rounded-2xl overflow-hidden hover:shadow-lg hover:border-ps-green-mid transition-all duration-200 hover:-translate-y-1">
              <Link to={`/products/${p._id}`} className="aspect-square relative flex-shrink-0 bg-[#f9fbf6] overflow-hidden block">
                {p.image_urls.length > 0 ? (
                  <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
                )}
                {p.stock === 0 && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-gray-900 text-white font-bold px-3 py-1 text-sm rounded-full">Out of Stock</span>
                  </div>
                )}
              </Link>
              <div className="p-4 flex flex-col flex-1">
                <div className="text-[11px] text-ps-green font-semibold uppercase tracking-wide capitalize mb-1">{p.category}</div>
                <Link to={`/products/${p._id}`} className="font-semibold text-ps-text-dark text-[14px] line-clamp-2 no-underline hover:text-ps-green transition-colors">
                  {p.name}
                </Link>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <div className="font-bold text-lg text-ps-text-dark">${p.price.toFixed(2)}</div>
                  <button
                    className="w-9 h-9 bg-ps-green text-white rounded-xl flex items-center justify-center hover:bg-[#27500A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={p.stock === 0}
                    onClick={() => addItem(p)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: data.pages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-[14px] font-semibold transition-all ${
                page === i + 1
                  ? "bg-ps-green text-white shadow-[0_4px_12px_rgba(59,109,17,0.25)]"
                  : "bg-white border border-[#eef2e8] text-ps-text-mid hover:border-ps-green-mid"
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

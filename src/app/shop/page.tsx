"use client";

import { ALL_PRODUCTS } from "@/lib/mock-data";
import { ProductCard } from "@/components/ui/ProductCard";
import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

export default function ShopPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = ["All", ...new Set(ALL_PRODUCTS.map(p => p.category))];

    const filteredProducts = ALL_PRODUCTS.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="min-h-screen bg-white pb-20 pt-8">
            <div className="px-6">
                <header className="mb-8">
                    <h1 className="font-empire text-5xl mb-6">Store</h1>

                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search our collection..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-sans focus:ring-2 focus:ring-black outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-lg flex-shrink-0">
                                <SlidersHorizontal size={18} />
                            </div>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 shadow-sm
                                        ${selectedCategory === cat
                                            ? "bg-black text-white"
                                            : "bg-white text-zinc-500 border border-zinc-100 hover:border-zinc-300"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Showing {filteredProducts.length} Results
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-black">
                        Sort: Newest <Filter size={12} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-10">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-zinc-500 font-sans italic">No items found matching your filter.</p>
                        <button
                            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                            className="mt-4 text-xs font-bold uppercase tracking-widest underline"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

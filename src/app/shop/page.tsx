"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ProductCard, type Product } from "@/components/ui/ProductCard";
import { Search, Filter, Menu, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("*, categories(name), product_images(*), product_variants(*)")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setProducts(data || []);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const categories = ["All", ...new Set(products.map(p => p.categories?.name || p.category || "General"))];

    const filteredProducts = products
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || (p.categories?.name || p.category || "General") === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === "price-low") {
                return (a.price_offer || a.price_base) - (b.price_offer || b.price_base);
            }
            if (sortBy === "price-high") {
                return (b.price_offer || b.price_base) - (a.price_offer || a.price_base);
            }
            // Default: newest
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
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
                    </div>
                </header>

                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-50">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1 text-black hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
                        >
                            <Menu size={20} />
                        </button>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                            {filteredProducts.length} Results
                        </span>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex items-center gap-1.5 text-xs font-medium text-black active:scale-95 transition-all"
                        >
                            Sort: {sortBy === "newest" ? "Newest" : sortBy === "price-low" ? "Price Low-High" : "Price High-Low"}
                            <Filter size={12} className={cn("transition-transform", isSortOpen && "rotate-180")} />
                        </button>

                        {isSortOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsSortOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {[
                                        { id: "newest", label: "Newest" },
                                        { id: "price-low", label: "Price: Low to High" },
                                        { id: "price-high", label: "Price: High to Low" }
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSortBy(option.id);
                                                setIsSortOpen(false);
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                                sortBy === option.id
                                                    ? "bg-zinc-900 text-white"
                                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-6">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="aspect-[4/5] bg-zinc-100 rounded-3xl"></div>
                                <div className="h-4 bg-zinc-100 rounded-full w-3/4"></div>
                                <div className="h-3 bg-zinc-100 rounded-full w-1/2"></div>
                            </div>
                        ))
                    ) : (
                        filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
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

            {/* Category Hamburger Menu Drawer */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300",
                    isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMenuOpen(false)}
            />
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-[110] w-full max-w-[280px] bg-white/70 backdrop-blur-md border-r border-zinc-200/50 shadow-2xl transition-transform duration-300 ease-out",
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-200/50">
                        <h3 className="font-empire text-xl text-black">Categories</h3>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                            <CloseIcon size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-4">
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setIsMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-5 py-4 rounded-2xl text-sm font-medium transition-all",
                                        selectedCategory === cat
                                            ? "bg-black/5 text-black transform scale-[1.02]"
                                            : "text-zinc-500 hover:bg-black/5 hover:text-black"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-zinc-200/50 bg-black/5">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Select category to filter</p>
                    </div>
                </div>
            </div>
            <ScrollToTop />
        </main>
    );
}

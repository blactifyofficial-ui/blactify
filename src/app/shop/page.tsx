"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product, ProductVariant } from "@/types/database";
import { Search, Filter, Menu, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";

export default function ShopPage() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [dbCategories, setDbCategories] = useState<string[]>(["All"]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("mixed");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Fallback: If images take too long, hide splash after 3 seconds anyway
        const timer = setTimeout(() => {
            setIsInitialLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const { data, error } = await supabase
                    .from("categories")
                    .select("name, products(id)");
                if (error) throw error;
                if (data) {
                    const categoriesWithCounts = data.map((c: { name: string; products: { id: string }[] | { id: string } | null }) => ({
                        name: c.name,
                        count: Array.isArray(c.products) ? c.products.length : c.products ? 1 : 0
                    }));

                    // Sort by count descending
                    categoriesWithCounts.sort((a, b) => b.count - a.count);

                    setDbCategories(["All", ...categoriesWithCounts.map((c) => c.name)]);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        }
        fetchCategories();
    }, []);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                let query = supabase
                    .from("products")
                    .select(`
                        *,
                        categories${selectedCategory !== "All" ? "!inner" : ""}(name),
                        product_images(url),
                        product_variants(stock)
                    `);

                if (debouncedSearchQuery) {
                    query = query.ilike('name', `%${debouncedSearchQuery}%`);
                }

                if (selectedCategory !== "All") {
                    query = query.eq('categories.name', selectedCategory);
                }

                // Sorting
                if (sortBy === "price-low") {
                    query = query.order('price_base', { ascending: true });
                } else if (sortBy === "price-high") {
                    query = query.order('price_base', { ascending: false });
                } else {
                    query = query.order('created_at', { ascending: false });
                }

                const { data, error } = await query;

                if (error) throw error;

                // Move out-of-stock products to the end while preserving existing sort order
                let sortedProducts = [...(data || [])];

                if (sortBy === "mixed") {
                    // Fisher-Yates shuffle
                    for (let i = sortedProducts.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [sortedProducts[i], sortedProducts[j]] = [sortedProducts[j], sortedProducts[i]];
                    }
                }

                sortedProducts = sortedProducts.sort((a, b) => {
                    const aOutOfStock = (a.product_variants?.every((v: ProductVariant) => v.stock <= 0) ?? (a.stock ?? 0) <= 0);
                    const bOutOfStock = (b.product_variants?.every((v: ProductVariant) => v.stock <= 0) ?? (b.stock ?? 0) <= 0);

                    if (aOutOfStock && !bOutOfStock) return 1;
                    if (!aOutOfStock && bOutOfStock) return -1;
                    return 0;
                });

                setProducts(sortedProducts);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
                // We don't set isInitialLoading to false here anymore, 
                // we wait for the first image load or the timeout
            }
        }
        fetchProducts();
    }, [debouncedSearchQuery, selectedCategory, sortBy]);

    const categories = dbCategories;

    const filteredProducts = products;

    if (!mounted || (isInitialLoading && !isFirstImageLoaded)) {
        return (
            <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="relative w-32 h-32 mb-6">
                    <Image
                        src="/logo-v1.png"
                        alt="Blactify"
                        fill
                        className="object-contain animate-pulse"
                        priority
                    />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 animate-pulse">
                        Blactify
                    </span>
                    <div className="h-[1px] w-12 bg-zinc-100 animate-pulse" />
                    <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-zinc-300">
                        Curating Essentials
                    </span>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white pb-20 pt-8 animate-in fade-in duration-700">
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
                            Sort: {sortBy === "mixed" ? "Mixed" : sortBy === "newest" ? "Newest" : sortBy === "price-low" ? "Price Low-High" : "Price High-Low"}
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
                                        { id: "mixed", label: "Mixed (Random)" },
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

                <div className="relative min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <div className="relative w-24 h-24 mb-4">
                                <Image
                                    src="/logo-v1.png"
                                    alt="Blactify"
                                    fill
                                    className="object-contain animate-pulse"
                                    priority
                                />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300 animate-pulse">
                                Loading Collection
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {filteredProducts.map((product: Product, index: number) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onImageLoad={index < 4 ? () => setIsFirstImageLoaded(true) : undefined}
                                />
                            ))}
                        </div>
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
                            {categories.map((cat: string) => (
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

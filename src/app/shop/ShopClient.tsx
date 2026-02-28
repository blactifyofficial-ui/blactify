"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product, ProductVariant } from "@/types/database";
import { Search, Filter, Menu, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { useDebounce } from "@/hooks/useDebounce";

interface ShopClientProps {
    initialProducts: Product[];
    initialCategories: string[];
}

export default function ShopClient({ initialProducts, initialCategories }: ShopClientProps) {
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("mixed");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(20);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const categories = initialCategories;

    // Filter AND sort the initially provided products
    let filteredProducts = [...initialProducts];

    // Filter by search
    if (debouncedSearchQuery) {
        filteredProducts = filteredProducts.filter((p) =>
            p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }

    // Filter by category
    if (selectedCategory !== "All") {
        // Handle cases where category could be an object, array, or string directly
        filteredProducts = filteredProducts.filter((p) => {
            const catField = p.categories as { name: string } | { name: string }[] | null;
            if (!catField) return false;
            if (Array.isArray(catField)) {
                return catField.some(c => c.name === selectedCategory);
            }
            if (typeof catField === 'object' && catField.name) {
                return catField.name === selectedCategory;
            }
            return false;
        });
    }

    // Sort products
    if (sortBy === "mixed") {
        // Simple stable pseudo-random sort based on product ID
        filteredProducts.sort((a, b) => {
            const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return (hashA % 13) - (hashB % 13) || a.id.localeCompare(b.id);
        });
    } else if (sortBy === "price-low") {
        filteredProducts.sort((a, b) => a.price_base - b.price_base);
    } else if (sortBy === "price-high") {
        filteredProducts.sort((a, b) => b.price_base - a.price_base);
    } else if (sortBy === "newest") {
        filteredProducts.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    // Always sort out-of-stock items to the bottom
    filteredProducts = filteredProducts.sort((a, b) => {
        const aOutOfStock = (a.product_variants?.every((v: ProductVariant) => v.stock <= 0) ?? (a.stock ?? 0) <= 0);
        const bOutOfStock = (b.product_variants?.every((v: ProductVariant) => v.stock <= 0) ?? (b.stock ?? 0) <= 0);

        if (aOutOfStock && !bOutOfStock) return 1;
        if (!aOutOfStock && bOutOfStock) return -1;
        return 0;
    });

    const paginatedProducts = filteredProducts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredProducts.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    // Splash screen while client hydrating only
    if (!mounted) {
        return (
            <div className="min-h-screen bg-white" />
        );
    }

    return (
        <main className="min-h-screen bg-white pb-20 pt-8 animate-in fade-in duration-700">
            <div className="px-6">
                <header className="mb-0">
                    <h1 className="font-empire text-xl mb-2">Store</h1>

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
                    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {paginatedProducts.map((product: Product, index: number) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                priority={index < 4}
                            />
                        ))}
                    </div>
                </div>

                {hasMore && (
                    <div className="flex justify-center mt-16 mb-12">
                        <button
                            onClick={handleLoadMore}
                            className="px-12 py-4 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-800 transition-all active:scale-95 shadow-xl"
                        >
                            Load More
                        </button>
                    </div>
                )}

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

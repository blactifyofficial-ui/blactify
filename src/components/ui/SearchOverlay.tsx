"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, History, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { ProductCard } from "./ProductCard";
import Image from "next/image";
import Link from "next/link";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const RECENT_SEARCHES = ["Nitro Tee", "Essentials Hoodie", "Oversized Jacket"];
const TRENDING_CATEGORIES = ["Best Sellers", "New Arrivals", "Accessories"];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const filteredProducts = query
        ? MOCK_PRODUCTS.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 4)
        : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-300">
            {/* Header */}
            <header className="flex h-20 items-center justify-between px-6 border-b border-zinc-50">
                <div className="flex flex-1 items-center gap-4 bg-zinc-50 rounded-2xl px-4 py-3">
                    <Search size={18} className="text-zinc-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for essentials..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-sans outline-none placeholder:text-zinc-400"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-zinc-400 hover:text-black">
                            <X size={16} />
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 h-12 w-12 flex items-center justify-center rounded-2xl border border-zinc-100 text-black hover:bg-zinc-50 transition-colors"
                >
                    <X size={20} />
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                {query === "" ? (
                    <div className="space-y-10">
                        {/* Recent Searches */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-zinc-400 uppercase text-[10px] font-bold tracking-widest">
                                <History size={14} />
                                <span>Recent Searches</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {RECENT_SEARCHES.map((search) => (
                                    <button
                                        key={search}
                                        onClick={() => setQuery(search)}
                                        className="px-4 py-2 bg-zinc-50 rounded-full text-xs font-medium hover:bg-black hover:text-white transition-all"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Trending Categories */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-zinc-400 uppercase text-[10px] font-bold tracking-widest">
                                <TrendingUp size={14} />
                                <span>Trending Now</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {TRENDING_CATEGORIES.map((category) => (
                                    <Link
                                        key={category}
                                        href="/shop"
                                        onClick={onClose}
                                        className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl group hover:bg-black transition-all"
                                    >
                                        <span className="text-sm font-bold uppercase tracking-tight group-hover:text-white">{category}</span>
                                        <ArrowRight size={16} className="text-zinc-300 group-hover:text-white" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                Results ({filteredProducts.length})
                            </h3>
                        </div>

                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={onClose}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="h-20 w-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6">
                                    <Search size={32} className="text-zinc-200" />
                                </div>
                                <h4 className="font-empire text-xl mb-2">No results found</h4>
                                <p className="text-xs text-zinc-400 font-sans">
                                    Try searching for something else or browse our collections.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

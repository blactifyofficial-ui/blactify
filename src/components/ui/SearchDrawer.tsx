"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Search, ShoppingBag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { type Product } from "@/types/database";
import Image from "next/image";
import Link from "next/link";

interface SearchDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [initialProducts, setInitialProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Load initial suggested products when drawer opens
    useEffect(() => {
        const fetchInitial = async () => {
            if (initialProducts.length > 0) return;
            setIsInitialLoading(true);
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("*, categories(name), product_images(url)")
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (error) throw error;
                setInitialProducts((data || []) as unknown as Product[]);
            } catch (err) {
                console.error("Initial load error:", err);
            } finally {
                setIsInitialLoading(false);
            }
        };

        if (isOpen) {
            fetchInitial();
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setQuery("");
            setResults([]);
            setHasTyped(false);
        }
    }, [isOpen, initialProducts.length]);

    const performSearch = useCallback(async (token: string) => {
        if (!token.trim()) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Using the verified shop pattern to ensure column compatibility and relation loading
            const { data, error } = await supabase
                .from("products")
                .select(`
                    *,
                    categories(name),
                    product_images(url)
                `)
                .ilike("name", `%${token}%`)
                .limit(8);

            if (error) throw error;
            setResults((data || []) as unknown as Product[]);
        } catch (err) {
            console.error("Search error:", err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsLoading(false);
            setHasTyped(false);
            return;
        }

        setHasTyped(true);
        const timer = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim()) {
            router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
            onClose();
        }
    };

    /**
     * Render a compact horizontal product card
     */
    const renderProductItem = (product: Product) => {
        // Handle various category response shapes (object vs array)
        const categoryData = product.categories as { name: string } | { name: string }[] | null;
        const categoryName = Array.isArray(categoryData) 
            ? categoryData[0]?.name 
            : (categoryData as { name: string })?.name || "General";

        // Determine primary image
        const primaryImage = product.product_images?.[0]?.url || product.main_image;

        return (
            <Link
                key={product.id}
                href={`/product/${product.handle || product.id}`}
                onClick={onClose}
                className="flex items-center gap-4 group p-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
                <div className="relative w-16 h-16 bg-white/5 flex-shrink-0 overflow-hidden rounded-sm">
                    {primaryImage ? (
                        <Image
                            src={primaryImage}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[8px] font-bold uppercase text-zinc-600">
                            No Image
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                        {categoryName}
                    </span>
                    <h4 className="text-[11px] font-normal text-white lowercase truncate">
                        {product.name}
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-white">
                            ₹{(product.price_offer || product.price_base || 0).toFixed(2)}
                        </span>
                        {product.price_offer && product.price_base && product.price_offer < product.price_base && (
                            <span className="text-[10px] text-zinc-400 line-through">
                                ₹{product.price_base.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Side Drawer */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-black/40 backdrop-blur-3xl border-l border-white/10 shadow-3xl transition-transform duration-500 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 px-8 py-4">
                        <span className="font-yapari text-xl tracking-tighter uppercase text-white">
                            STUDIO
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1 text-white hover:opacity-50 transition-opacity"
                            aria-label="Close search"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Field Area */}
                    <div className="p-8 space-y-8 flex flex-col h-full overflow-hidden">
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search Now..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-white/20 py-3 px-10 text-sm focus:outline-none focus:border-white transition-all placeholder:text-zinc-600 text-white"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                {isLoading && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" size={16} />
                                )}
                            </div>
                        </form>

                        {/* Search Results */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {!hasTyped && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Suggested for you</p>
                                        {isInitialLoading && <Loader2 size={12} className="animate-spin text-zinc-300" />}
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {initialProducts.map(renderProductItem)}
                                        {!isInitialLoading && initialProducts.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                                <Search size={32} strokeWidth={1} />
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-4">Start typing to find more</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {hasTyped && results.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Quick Results</p>
                                    <div className="space-y-3">
                                        {results.map(renderProductItem)}
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        className="w-full mt-6 py-4 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white"
                                    >
                                        View All Search Results
                                    </button>
                                </div>
                            )}

                            {hasTyped && !isLoading && results.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                                    <ShoppingBag size={48} strokeWidth={1} />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No products found for "{query}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

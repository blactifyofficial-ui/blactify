"use client";

import { useState } from "react";
import { ProductGrid } from "./ProductGrid";
import { fetchMoreProducts } from "./actions";
import type { Product } from "@/types/database";

interface LoadMoreProps {
    initialHasMore: boolean;
    category?: string;
    search?: string;
    sortBy?: string;
    limit: number;
}

export function LoadMore({ initialHasMore, category, search, sortBy, limit }: LoadMoreProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialHasMore);

    const loadMore = async () => {
        setLoading(true);
        try {
            const offset = page * limit;
            const res = await fetchMoreProducts(offset, limit, category, search, sortBy);
            setProducts((prev) => [...prev, ...res.products]);
            setHasMore(res.hasMore);
            setPage((prev) => prev + 1);
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!hasMore && products.length === 0) return null;

    return (
        <>
            {products.length > 0 && (
                <div className="mt-10">
                    <ProductGrid products={products} initialOffset={limit} />
                </div>
            )}
            {hasMore && (
                <div className="flex justify-center mt-16 mb-12">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-12 py-4 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-800 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}
        </>
    );
}

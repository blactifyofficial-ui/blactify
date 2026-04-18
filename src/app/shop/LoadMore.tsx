"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
    const observerRef = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const offset = page * limit;
            const res = await fetchMoreProducts(offset, limit, category, search, sortBy);
            setProducts((prev) => [...prev, ...res.products]);
            setHasMore(res.hasMore);
            setPage((prev) => prev + 1);
        } catch {
            // handle silently as UI already handles loading state
        } finally {
            setLoading(false);
        }
    }, [page, limit, category, search, sortBy, loading, hasMore]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = observerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [loadMore, hasMore, loading]);

    if (!hasMore && products.length === 0) return null;

    return (
        <>
            {products.length > 0 && (
                <div className="mt-10">
                    <ProductGrid products={products} initialOffset={limit} />
                </div>
            )}
            {hasMore && (
                <div ref={observerRef} className="flex justify-center mt-16 mb-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
                </div>
            )}
        </>
    );
}

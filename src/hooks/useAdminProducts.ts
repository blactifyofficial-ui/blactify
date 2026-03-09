"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { toast } from "sonner";

interface UseAdminProductsProps {
    page: number;
    pageSize: number;
    searchTerm?: string;
    showOnHome?: boolean;
}

export function useAdminProducts({ page, pageSize, searchTerm, showOnHome }: UseAdminProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from("products")
                .select(`
                    *,
                    categories!left (
                        name
                    ),
                    product_variants (
                        id,
                        size,
                        stock
                    ),
                    product_images (
                        url,
                        position
                    )
                `, { count: 'exact' });

            if (searchTerm && searchTerm.trim() !== "") {
                const term = searchTerm.trim();
                // Search in name or handle
                query = query.or(`name.ilike.%${term}%,handle.ilike.%${term}%`);
            }

            if (showOnHome) {
                query = query.eq('show_on_home', true);
            }

            // Attempt to order by updated_at, fallback to created_at if it fails
            const { data, error: supabaseError, count } = await query
                .order("updated_at", { ascending: false, nullsFirst: false })
                .range(from, to);

            if (supabaseError) {
                console.error("Supabase Query Error:", supabaseError);
                // Fallback attempt if updated_at is missing
                if (supabaseError.message.includes('column "updated_at" does not exist')) {
                    const fallback = await query
                        .order("created_at", { ascending: false })
                        .range(from, to);
                    if (fallback.error) throw fallback.error;

                    const processedData = processProductData(fallback.data || []);
                    setProducts(processedData);
                    setTotalCount(fallback.count || 0);
                    return;
                }
                throw supabaseError;
            }

            const processedData = processProductData(data || []);
            setProducts(processedData);
            setTotalCount(count || 0);
        } catch (err: unknown) {
            console.error("Registry Reconciliation Error:", err);
            setError(err instanceof Error ? err : new Error("Failed to fetch products"));
            toast.error("Inventory sync failed", {
                description: "Unable to reconcile product registry. See console for details.",
            });
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchTerm, showOnHome]);

    // Helper to process raw supabase data
    const processProductData = (data: Product[]) => {
        return data.map(product => {
            const images = product.product_images || [];
            const mainImg = images.find((img: { position: number; url: string }) => img.position === 0) || images[0];

            return {
                ...product,
                stock: (product.product_variants as { stock: number }[])?.reduce((sum: number, v: { stock: number }) => sum + (v.stock || 0), 0) || 0,
                main_image: mainImg?.url || null
            };
        }) as Product[];
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts();
        }, searchTerm ? 400 : 0);
        return () => clearTimeout(handler);
    }, [fetchProducts, searchTerm, showOnHome]);

    return { products, totalCount, loading, error, refetch: fetchProducts };
}

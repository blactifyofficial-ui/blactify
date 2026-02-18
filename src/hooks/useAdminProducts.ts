"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { toast } from "sonner";

interface UseAdminProductsProps {
    page: number;
    pageSize: number;
    searchTerm?: string;
}

export function useAdminProducts({ page, pageSize, searchTerm }: UseAdminProductsProps) {
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
                        stock
                    ),
                    product_images (
                        url,
                        position
                    )
                `, { count: 'exact' });

            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            const { data, error: supabaseError, count } = await query
                .order("created_at", { ascending: false })
                .range(from, to);

            if (supabaseError) throw supabaseError;

            const processedData = (data || []).map(product => {
                const images = product.product_images || [];
                const mainImg = images.find((img: any) => img.position === 0) || images[0];

                return {
                    ...product,
                    stock: product.product_variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0,
                    main_image: mainImg?.url || null
                };
            });

            setProducts(processedData as any[]);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error("Fetch products error:", err);
            setError(err);
            toast.error("Inventory sync failed", {
                description: "Unable to reconcile product registry.",
            });
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchTerm]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts();
        }, searchTerm ? 400 : 0);
        return () => clearTimeout(handler);
    }, [fetchProducts, searchTerm]);

    return { products, totalCount, loading, error, refetch: fetchProducts };
}

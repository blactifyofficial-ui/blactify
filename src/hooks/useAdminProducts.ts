"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product, Drop, DropMapping } from "@/types/database";
import { toast } from "sonner";

interface UseAdminProductsProps {
    page: number;
    pageSize: number;
    searchTerm?: string;
    categoryId?: string;
    status?: 'active' | 'hidden' | 'all';
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'all';
}

export function useAdminProducts({ page, pageSize, searchTerm, categoryId, status, stockStatus = 'all' }: UseAdminProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch drops and mappings for visibility calculation
            const [dropsRes, mappingsRes] = await Promise.all([
                fetch("/api/admin/drops"),
                fetch("/api/admin/drops/mappings")
            ]);
            const dropsData: Drop[] = await dropsRes.json();
            const mappingsData: DropMapping[] = await mappingsRes.json();
            const nowTime = new Date();
            const sevenDaysAgo = new Date(nowTime.getTime() - 7 * 24 * 60 * 60 * 1000);

            const hiddenProductIds = new Set<string>();
            const unPublishedDropIds = new Set(
                (dropsData || [])
                    .filter((drop) => new Date(drop.publishDate) > nowTime)
                    .map((drop) => drop.id)
            );

            (mappingsData || []).forEach((mapping) => {
                if (unPublishedDropIds.has(mapping.dropId)) {
                    hiddenProductIds.add(mapping.productId);
                }
            });

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from("products")
                .select(`
                    *,
                    categories!left (
                        id,
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
                query = query.or(`name.ilike.%${term}%,handle.ilike.%${term}%,id.ilike.%${term}%`);
            }

            if (categoryId && categoryId !== "all") {
                query = query.eq('category_id', categoryId);
            }

            // Stock status and Visibility status require JS-side filtering 
            // since stock is summed from variants and visibility from drops.
            const useJSFilter = (status && status !== 'all') || (stockStatus && stockStatus !== 'all');

            const finalQuery = useJSFilter 
                ? query.order("updated_at", { ascending: false, nullsFirst: false }).limit(1000)
                : query.order("updated_at", { ascending: false, nullsFirst: false }).range(from, to);

            const { data, error: supabaseError, count } = await finalQuery;

            if (supabaseError) throw supabaseError;

            let processedData = (data || []).map(product => {
                const images = product.product_images || [];
                const mainImg = images.find((img: { position: number }) => img.position === 0) || images[0];
                const stock = (product.product_variants as { stock: number }[])?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                
                const is_hidden_by_drop = hiddenProductIds.has(product.id);
                const is_out_of_stock_long = product.out_of_stock_at && new Date(product.out_of_stock_at) <= sevenDaysAgo;
                const is_active = !is_hidden_by_drop && !is_out_of_stock_long;

                return {
                    ...product,
                    stock,
                    main_image: mainImg?.url || null,
                    is_active,
                    visibility_status: is_active ? 'active' : 'hidden'
                } as Product & { is_active: boolean, visibility_status: 'active' | 'hidden', stock: number };
            });

            if (useJSFilter) {
                // Apply visibility filter
                if (status && status !== 'all') {
                    processedData = processedData.filter(p => p.visibility_status === status);
                }
                
                // Apply stock filter
                if (stockStatus && stockStatus !== 'all') {
                    processedData = processedData.filter(p => {
                        const s = (p as Product & { stock: number }).stock || 0;
                        if (stockStatus === 'out_of_stock') return s === 0;
                        if (stockStatus === 'low_stock') return s > 0 && s <= 10;
                        if (stockStatus === 'in_stock') return s > 0;
                        return true;
                    });
                }
                const start = from;
                const total = processedData.length;
                const paginated = processedData.slice(start, start + pageSize);
                setProducts(paginated);
                setTotalCount(total);
            } else {
                setProducts(processedData);
                setTotalCount(count || 0);
            }

        } catch (err: unknown) {
            console.error("Registry Reconciliation Error:", err);
            setError(err instanceof Error ? err : new Error("Failed to fetch products"));
            toast.error("Inventory sync failed");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchTerm, categoryId, status, stockStatus]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts();
        }, searchTerm ? 400 : 0);
        return () => clearTimeout(handler);
    }, [fetchProducts, searchTerm, categoryId, status, stockStatus]);

    return { products, totalCount, loading, error, refetch: fetchProducts };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Category, Drop, DropMapping } from "@/types/database";
import { toast } from "sonner";

interface UseAdminCategoriesProps {
    page: number;
    pageSize: number;
}

export function useAdminCategories({ page, pageSize }: UseAdminCategoriesProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCategories = useCallback(async () => {
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

            const { data, error: supabaseError, count } = await supabase
                .from("categories")
                .select(`
                    *,
                    category_measurements (
                        measurement_types (
                            name
                        )
                    ),
                    products (
                        id, 
                        name, 
                        price_base, 
                        price_offer, 
                        out_of_stock_at,
                        product_images (url, position)
                    )
                `, { count: 'exact' })
                .order("name")
                .range(from, to);

            if (supabaseError) throw supabaseError;

            interface CategoryWithMeasurements extends Omit<Category, 'category_measurements' | 'products'> {
                category_measurements?: {
                    measurement_types: {
                        name: string;
                    };
                }[];
                products?: { 
                    id: string, 
                    name: string,
                    price_base: number,
                    price_offer: number | null,
                    out_of_stock_at: string | null,
                    product_images: { url: string, position: number }[]
                }[];
            }

            const sevenDaysAgo = new Date(nowTime.getTime() - 7 * 24 * 60 * 60 * 1000);

            const formattedData = (data as unknown as CategoryWithMeasurements[] || []).map((cat): Category => {
                const allProducts = cat.products || [];
                
                const productsWithMeta = allProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price_base: p.price_base,
                    price_offer: p.price_offer ?? undefined,
                    out_of_stock_at: p.out_of_stock_at,
                    image_url: p.product_images?.find(img => img.position === 0)?.url || p.product_images?.[0]?.url,
                    is_hidden: hiddenProductIds.has(p.id)
                }));

                const activeProducts = productsWithMeta.filter(p => {
                    if (p.is_hidden) return false;
                    if (!p.out_of_stock_at) return true;
                    return new Date(p.out_of_stock_at) > sevenDaysAgo;
                });

                return {
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    image_url: cat.image_url,
                    image_size_toggle: cat.image_size_toggle,
                    created_at: cat.created_at,
                    size_config: cat.category_measurements?.map(cm => cm.measurement_types?.name).filter(Boolean) || cat.size_config || [],
                    product_count: activeProducts.length,
                    total_product_count: allProducts.length,
                    products: productsWithMeta
                };
            });

            setCategories(formattedData);
            setTotalCount(count || 0);
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error("Failed to fetch categories"));
            toast.error("Network synchronization failed", {
                description: "Unable to retrieve latest category intelligence.",
            });
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, totalCount, loading, error, refetch: fetchCategories };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
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
                    )
                `, { count: 'exact' })
                .order("name")
                .range(from, to);

            if (supabaseError) throw supabaseError;

            interface CategoryWithMeasurements extends Omit<Category, 'category_measurements'> {
                category_measurements?: {
                    measurement_types: {
                        name: string;
                    };
                }[];
            }

            const formattedData = (data as unknown as CategoryWithMeasurements[] || []).map((cat): Category => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                created_at: cat.created_at,
                size_config: cat.category_measurements?.map(cm => cm.measurement_types?.name).filter(Boolean) || cat.size_config || []
            }));

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

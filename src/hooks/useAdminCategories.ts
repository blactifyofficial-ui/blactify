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

            const formattedData = (data || []).map((cat: any) => ({
                ...cat,
                size_config: cat.category_measurements?.map((cm: any) => cm.measurement_types?.name).filter(Boolean) || cat.size_config || []
            }));

            setCategories(formattedData);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error("Fetch categories error:", err);
            setError(err);
            toast.error("Taxonomy sync failed", {
                description: "Unable to reconcile categorical data.",
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

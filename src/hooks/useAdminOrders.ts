"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types/database";
import { toast } from "sonner";

interface UseAdminOrdersProps {
    page: number;
    pageSize: number;
    searchTerm?: string;
}

export function useAdminOrders({ page, pageSize, searchTerm }: UseAdminOrdersProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from("orders")
                .select("*", { count: 'exact' });

            if (searchTerm) {
                // Search in ID or customer name
                query = query.or(`id.ilike.%${searchTerm}%,customer_details->>name.ilike.%${searchTerm}%`);
            }

            const { data, error: supabaseError, count } = await query
                .order("created_at", { ascending: false })
                .range(from, to);

            if (supabaseError) throw supabaseError;

            setOrders((data as any[]) || []);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error("Fetch orders error:", err);
            setError(err);
            toast.error("Network synchronization failed", {
                description: "Unable to retrieve latest order intelligence.",
            });
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchTerm]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchOrders();
        }, searchTerm ? 400 : 0);
        return () => clearTimeout(handler);
    }, [fetchOrders, searchTerm]);

    return { orders, totalCount, loading, error, refetch: fetchOrders };
}

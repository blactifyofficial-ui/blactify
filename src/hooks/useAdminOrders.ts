"use client";

import { useState, useEffect, useCallback } from "react";
import { Order } from "@/types/database";
import { toast } from "sonner";
import { getAdminOrders } from "@/app/actions/orders";

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
            const result = await getAdminOrders({
                page,
                pageSize,
                searchTerm
            });

            if (result.success) {
                setOrders(result.orders as any[]);
                setTotalCount(result.totalCount);
            } else {
                throw new Error(result.error || "Failed to synchronise order data");
            }
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

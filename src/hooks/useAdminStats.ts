"use client";

import { useState, useEffect, useCallback } from "react";
// import { supabase } from "@/lib/supabase"; // Removed
import { Order } from "@/types/database";
import { toast } from "sonner";
import { getAdminStats } from "@/app/actions/stats";

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    recentOrders: Order[];
    revenueByMonth: { month: string; amount: number }[];
    conversionRate: string;
    activeUsers: number;
    userGrowth: string;
    topProducts: { name: string; sales: number; revenue: number }[];
}

export function useAdminStats() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        totalOrders: 0,
        recentOrders: [],
        revenueByMonth: [],
        conversionRate: "0%",
        activeUsers: 0,
        userGrowth: "0%",
        topProducts: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAdminStats();

            if (!result.success || !result.stats) {
                throw new Error(String(result.error) || "Failed to fetch stats");
            }

            // Map server types to client types if needed
            setStats({
                totalRevenue: result.stats.totalRevenue,
                totalOrders: result.stats.totalOrders,
                recentOrders: result.stats.recentOrders as Order[],
                revenueByMonth: result.stats.revenueByMonth,
                conversionRate: result.stats.conversionRate || "0%",
                activeUsers: result.stats.activeUsers,
                userGrowth: result.stats.userGrowth || "0%",
                topProducts: result.stats.topProducts
            });

        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error("Failed to fetch dashboard statistics"));
            toast.error("Intelligence sync failed", {
                description: "Unable to reconcile global performance metrics.",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
}

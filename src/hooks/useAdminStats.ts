"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types/database";
import { toast } from "sonner";

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    recentOrders: Order[];
    revenueByMonth: { month: string; amount: number }[];
    conversionRate: string;
    activeUsers: number;
    userGrowth: string;
}

export function useAdminStats() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        totalOrders: 0,
        recentOrders: [],
        revenueByMonth: [],
        conversionRate: "0%",
        activeUsers: 0,
        userGrowth: "0%"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all orders for revenue calculation
            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (ordersError) throw ordersError;

            const typedOrders = (orders || []) as Order[];
            const revenue = typedOrders.reduce((sum, order) => sum + Number(order.amount), 0) || 0;

            // Simple revenue by month calculation (last 6 months)
            const last6Months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return d.toLocaleString('default', { month: 'short' });
            }).reverse();

            const revByMonth = last6Months.map(month => {
                const amount = typedOrders
                    .filter(o => new Date(o.created_at).toLocaleString('default', { month: 'short' }) === month)
                    .reduce((sum, o) => sum + Number(o.amount), 0);
                return { month, amount };
            });

            // Fetch actual users count
            const { count: usersCount, error: usersError } = await supabase
                .from("profiles")
                .select("*", { count: 'exact', head: true });

            if (usersError) throw usersError;

            // Fetch users from last 30 days for growth calculation
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            let recentUsersCount = 0;
            try {
                const { count } = await supabase
                    .from("profiles")
                    .select("*", { count: 'exact', head: true })
                    .gt("created_at", thirtyDaysAgo.toISOString());
                recentUsersCount = count || 0;
            } catch (err) {
                console.warn("Failed to fetch growth stats: created_at column might be missing. Proceeding with 0% growth.");
            }

            const growth = usersCount && usersCount > 0
                ? `+${Math.round((recentUsersCount / usersCount) * 100)}%`
                : "0%";


            setStats(prev => ({
                ...prev,
                totalRevenue: revenue,
                totalOrders: typedOrders.length,
                recentOrders: typedOrders.slice(0, 5),
                revenueByMonth: revByMonth,
                activeUsers: usersCount || 0,
                userGrowth: growth
            }));
        } catch (err: any) {
            console.error("Fetch dashboard stats error:", err);
            setError(err);
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

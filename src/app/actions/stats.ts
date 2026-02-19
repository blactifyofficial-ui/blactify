"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Order } from "@/types/database";

export async function getAdminStats() {
    try {
        // Fetch all orders for revenue and order count
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (ordersError) throw new Error(ordersError.message);

        const typedOrders = (orders || []) as Order[];
        const revenue = typedOrders.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
        const totalOrders = typedOrders.length;

        // Active Users (Total Profiles)
        const { count: usersCount, error: usersError } = await supabaseAdmin
            .from("profiles")
            .select("*", { count: 'exact', head: true });

        if (usersError) throw new Error(usersError.message);

        // Recent Users (Last 30 Days) for Growth
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let recentUsersCount = 0;
        try {
            const { count } = await supabaseAdmin
                .from("profiles")
                .select("*", { count: 'exact', head: true })
                .gt("created_at", thirtyDaysAgo.toISOString());
            recentUsersCount = count || 0;
        } catch {
            // Ignore if column doesn't exist
        }

        const userGrowth = usersCount && usersCount > 0
            ? `+${Math.round((recentUsersCount / usersCount) * 100)}%`
            : "0%";

        // Revenue by Month (Last 6 Months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return d.toLocaleString('default', { month: 'short' });
        }).reverse();

        const revenueByMonth = last6Months.map(month => {
            const amount = typedOrders
                .filter(o => new Date(o.created_at).toLocaleString('default', { month: 'short' }) === month)
                .reduce((sum, o) => sum + Number(o.amount), 0);
            return { month, amount };
        });

        // Top Products
        const productSales: Record<string, { sales: number; revenue: number }> = {};
        typedOrders.forEach(order => {
            const items = (order.items || []) as Array<{ name?: string; quantity?: number; price_at_purchase?: number; price_base?: number }>;
            items.forEach(item => {
                const name = item.name || "Unknown Product";
                if (!productSales[name]) {
                    productSales[name] = { sales: 0, revenue: 0 };
                }
                productSales[name].sales += Number(item.quantity) || 0;
                productSales[name].revenue += (Number(item.price_at_purchase) || Number(item.price_base) || 0) * (Number(item.quantity) || 0);
            });
        });

        const topProducts = Object.entries(productSales)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 4);

        return {
            success: true,
            stats: {
                totalRevenue: revenue,
                totalOrders: totalOrders,
                recentOrders: typedOrders.slice(0, 5),
                revenueByMonth,
                activeUsers: usersCount || 0,
                userGrowth,
                topProducts,
                conversionRate: "0%" // Placeholder until analytics
            }
        };

    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch stats"
        };
    }
}

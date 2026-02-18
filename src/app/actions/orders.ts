"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

interface GetAdminOrdersProps {
    page: number;
    pageSize: number;
    searchTerm?: string;
}

export async function getAdminOrders({ page, pageSize, searchTerm }: GetAdminOrdersProps) {
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabaseAdmin
            .from("orders")
            .select("*", { count: 'exact' });

        if (searchTerm) {
            // Search in ID or customer name (from customer_details JSONB)
            query = query.or(`id.ilike.%${searchTerm}%,customer_details->>name.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("getAdminOrders database error:", error);
            throw new Error(error.message);
        }

        return {
            orders: data || [],
            totalCount: count || 0,
            success: true
        };
    } catch (error: any) {
        console.error("getAdminOrders unexpected error:", error);
        return {
            orders: [],
            totalCount: 0,
            success: false,
            error: error.message
        };
    }
}

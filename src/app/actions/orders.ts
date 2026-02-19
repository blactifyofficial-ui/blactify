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
            throw new Error(error.message);
        }

        return {
            orders: data || [],
            totalCount: count || 0,
            success: true
        };
    } catch (error: unknown) {
        return {
            orders: [],
            totalCount: 0,
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred"
        };
    }
}

export async function getAdminOrderById(id: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            order: data,
            success: true
        };
    } catch (error: unknown) {
        return {
            order: null,
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred"
        };
    }
}

export async function updateAdminOrder(id: string, updates: Record<string, unknown>) {
    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            order: data,
            success: true
        };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Update Failed" };
    }
}

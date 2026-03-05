"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyActionAdminAuth } from "@/lib/auth-server";

interface GetAdminOrdersProps {
    page: number;
    pageSize: number;
    searchTerm?: string;
}

export async function getAdminOrders({ page, pageSize, searchTerm }: GetAdminOrdersProps) {
    try {
        await verifyActionAdminAuth();
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
        await verifyActionAdminAuth();
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
        await verifyActionAdminAuth();
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

export async function getAllOrdersForReport() {
    try {
        await verifyActionAdminAuth();
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);

        return { success: true, orders: data || [] };
    } catch (error: unknown) {
        return {
            success: false,
            orders: [],
            error: error instanceof Error ? error.message : "Failed to fetch orders"
        };
    }
}

import { appendOrderToSheet } from "@/lib/google-sheets";

export async function testSheetSync() {
    try {
        await verifyActionAdminAuth();
        await appendOrderToSheet({
            id: "TEST_SYNC_" + Math.random().toString(36).substring(7).toUpperCase(),
            items: [
                { name: "Test Subscription Alpha", size: "N/A", quantity: 1 }
            ],
            customer_details: {
                name: "Admin System Check",
                email: "admin@blactify.com",
                phone: "0000000000"
            },
            shipping_address: {
                address: "Admin Dashboard",
                city: "Cloud",
                district: "System",
                state: "Network",
                pincode: "000000"
            },
            amount: 0,
            status: "paid"
        });
        return { success: true };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Test failed" };
    }
}

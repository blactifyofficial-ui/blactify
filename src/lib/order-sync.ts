"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { appendOrderToSheet } from "./google-sheets";
import { OrderSyncSchema } from "./schemas";
import { z } from "zod";

export async function saveOrder(orderData: z.infer<typeof OrderSyncSchema>) {
    const validatedData = OrderSyncSchema.safeParse(orderData);
    if (!validatedData.success) {
        return {
            success: false,
            error: {
                message: validatedData.error.issues[0].message,
                technical: JSON.stringify(validatedData.error.format())
            }
        };
    }
    const data = validatedData.data;

    try {
        const orderIdToSave = data.razorpay_order_id || `order_${Date.now()}`;

        const { data: rpcData, error } = await supabaseAdmin.rpc('create_order_v2', {
            p_order_id: orderIdToSave,
            p_user_id: data.user_id,
            p_amount: data.amount,
            p_currency: data.currency,
            p_status: data.status,
            p_shipping_address: data.shipping_address,
            p_customer_details: data.customer_details,
            p_payment_details: data.payment_details || {},
            p_items: data.items
        });

        if (error || !rpcData?.success) {
            const techMessage = error?.message || rpcData?.error || "Unknown error during order creation";

            let userMessage = "Failed to complete your purchase. Please try again.";
            if (techMessage.includes("Insufficient stock")) {
                userMessage = techMessage;
            } else if (techMessage.includes("variant not found")) {
                userMessage = "One of the items in your bag is no longer available.";
            }

            return { success: false, error: { message: userMessage, technical: techMessage } };
        }


        // 3. Sync to Google Sheets (Non-blocking)
        appendOrderToSheet({
            id: orderIdToSave,
            items: data.items,
            customer_details: data.customer_details,
            amount: data.amount,
            status: data.status
        }).catch(() => { });

        return { success: true };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        return {
            success: false,
            error: {
                message: "An unexpected error occurred. Please contact support if the amount was deducted.",
                technical: errorMessage
            }
        };
    }
}

export async function getOrder(orderId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (error) {
            throw error;
        }

        return { success: true, order: data };
    } catch {
        return { success: false, error: "Failed to get order" };
    }
}

export async function getUserOrders(userId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        return { success: true, orders: data || [] };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        return { success: false, error: errorMessage };
    }
}

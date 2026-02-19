"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { appendOrderToSheet } from "./google-sheets";

export async function saveOrder(orderData: {
    user_id: string;
    items: unknown;
    amount: number;
    currency: string;
    shipping_address: unknown;
    customer_details: unknown;
    status: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    payment_details?: unknown;
}) {
    try {
        const orderIdToSave = orderData.razorpay_order_id || `order_${Date.now()}`;

        const { data, error } = await supabaseAdmin.rpc('create_order_v2', {
            p_order_id: orderIdToSave,
            p_user_id: orderData.user_id,
            p_amount: orderData.amount,
            p_currency: orderData.currency,
            p_status: orderData.status,
            p_shipping_address: orderData.shipping_address,
            p_customer_details: orderData.customer_details,
            p_payment_details: orderData.payment_details || {},
            p_items: orderData.items
        });

        if (error || !data?.success) {
            const techMessage = error?.message || data?.error || "Unknown error during order creation";

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
            items: orderData.items as { name: string; size?: string; quantity: number }[],
            customer_details: orderData.customer_details as { name: string; email: string; phone: string },
            amount: orderData.amount,
            status: orderData.status
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

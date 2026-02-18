"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

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
        console.log("Creating atomic order with ID:", orderIdToSave);

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
            console.error("Atomic order creation failure:", techMessage);

            let userMessage = "Failed to complete your purchase. Please try again.";
            if (techMessage.includes("Insufficient stock")) {
                userMessage = techMessage;
            } else if (techMessage.includes("variant not found")) {
                userMessage = "One of the items in your bag is no longer available.";
            }

            return { success: false, error: { message: userMessage, technical: techMessage } };
        }

        console.log("Atomic order created successfully:", orderIdToSave);
        return { success: true };
    } catch (err: any) {
        console.error("Critical error in saveOrder:", err.message);
        return {
            success: false,
            error: {
                message: "An unexpected error occurred. Please contact support if the amount was deducted.",
                technical: err.message
            }
        };
    }
}

export async function getOrder(orderId: string) {
    console.log("Fetching order details for ID:", orderId);
    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (error) {
            console.error("Fetch order error details:", {
                message: error.message,
                details: error.details,
                code: error.code
            });
            throw error;
        }

        console.log("Order fetched successfully:", data?.id);
        return { success: true, order: data };
    } catch (err: any) {
        console.error("Fetch order error:", err.message);
        return { success: false, error: err.message };
    }
}

export async function getUserOrders(userId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, orders: data || [] };
    } catch (err: any) {
        console.error("Fetch user orders error:", err.message);
        return { success: false, error: err.message };
    }
}

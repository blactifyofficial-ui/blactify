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
}) {
    // Helper to decrement stock using secure RPC
    const decrementStockSecure = async (items: any[]) => {
        try {

            for (const item of items) {
                let size = (item as any).size;

                // Auto-resolve size if missing (handles "One Size" default variants)
                if (!size || size === "no size") {
                    const { data: variants } = await supabaseAdmin
                        .from('product_variants')
                        .select('size')
                        .eq('product_id', item.id);

                    if (variants && variants.length === 1) {
                        size = variants[0].size;

                    } else {
                        size = "no size";
                    }
                }

                const { data: success, error: stockError } = await supabaseAdmin.rpc('decrement_stock_secure', {
                    p_product_id: String(item.id),
                    p_size: size,
                    p_quantity: item.quantity
                });



                if (stockError || !success) {
                    const errorMsg = stockError?.message || `Insufficient stock for ${item.name || item.id} (${size})`;

                    throw new Error(errorMsg);
                }
            }

        } catch (err) {

            throw err;
        }
    };

    try {
        console.log("Starting saveOrder for ID:", orderData.razorpay_order_id);
        // 1. Try to decrement stock first as an atomic operation
        // This acts as a final check and reservation
        await decrementStockSecure(orderData.items as any[]);
        console.log("Stock decrement successful for ID:", orderData.razorpay_order_id);

        // 2. If stock decrement was successful, save the order
        const orderIdToSave = orderData.razorpay_order_id || `order_${Date.now()}`;
        console.log("Inserting order into DB with ID:", orderIdToSave);

        const { data: savedData, error } = await supabaseAdmin
            .from("orders")
            .insert([
                {
                    id: orderIdToSave,
                    payment_id: orderData.razorpay_payment_id,
                    user_id: orderData.user_id,
                    items: orderData.items,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    shipping_address: orderData.shipping_address,
                    customer_details: orderData.customer_details,
                    status: orderData.status,
                },
            ])
            .select();

        if (error) {
            console.error("Order save error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return { success: false, error: { message: "Failed to save order details.", technical: error.message } };
        }

        console.log("Order saved successfully in DB:", savedData?.[0]?.id);
        return { success: true };
    } catch (err: any) {
        console.error("Critical error in saveOrder:", err.message);

        let userMessage = "An unexpected error occurred during checkout. Please try again.";
        const techMessage = err.message || "";

        if (techMessage.includes("decrement_stock_secure") && techMessage.includes("schema cache")) {
            userMessage = "Checkout system maintenance. Please try again in a few minutes.";
        } else if (techMessage.includes("Insufficient stock") || techMessage.includes("stock")) {
            userMessage = techMessage; // Already user-friendly or contains product name
        } else if (techMessage.includes("not found")) {
            userMessage = "One or more items in your cart are no longer available.";
        } else if (techMessage.includes("Razorpay")) {
            userMessage = "Payment verification failed. Please check your bank and contact us if the amount was deducted.";
        }

        return { success: false, error: { message: userMessage, technical: techMessage } };
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

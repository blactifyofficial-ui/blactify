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
        // 1. Try to decrement stock first as an atomic operation
        // This acts as a final check and reservation
        await decrementStockSecure(orderData.items as any[]);

        // 2. If stock decrement was successful, save the order
        const { error } = await supabaseAdmin
            .from("orders")
            .insert([
                {
                    id: orderData.razorpay_order_id || `order_${Date.now()}`, // Using order_id as PK as per schema
                    payment_id: orderData.razorpay_payment_id,
                    user_id: orderData.user_id,
                    items: orderData.items,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    shipping_address: orderData.shipping_address,
                    customer_details: orderData.customer_details,
                    status: orderData.status,
                },
            ]);

        if (error) {
            console.error("Order save error:", error);
            return { success: false, error: { message: "Failed to save order details." } };
        }

        return { success: true };
    } catch (err: any) {


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

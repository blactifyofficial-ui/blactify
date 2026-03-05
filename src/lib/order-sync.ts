"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { appendOrderToSheet } from "./google-sheets";
import { OrderSyncSchema } from "./schemas";
import { z } from "zod";
import { verifyActionAuth } from "./auth-server";
import crypto from "crypto";

export async function saveOrder(orderData: z.infer<typeof OrderSyncSchema>) {
    try {
        const auth = await verifyActionAuth();
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
        if (auth.uid !== data.user_id) {
            return { success: false, error: { message: "Forbidden: You can only save your own orders." } };
        }

        // --- PAYMENT VERIFICATION ---
        if (data.status === "paid") {
            const razorpay_order_id = data.razorpay_order_id;
            const razorpay_payment_id = data.razorpay_payment_id;
            const razorpay_signature = data.payment_details?.razorpay_signature as string;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return { success: false, error: { message: "Missing payment verification details." } };
            }

            const key_secret = process.env.RAZORPAY_KEY_SECRET;
            if (!key_secret) {
                console.error("RAZORPAY_KEY_SECRET is not configured");
                return { success: false, error: { message: "Payment verification failed: secret missing." } };
            }

            const expected_signature = crypto
                .createHmac("sha256", key_secret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest("hex");

            if (expected_signature !== razorpay_signature) {
                return { success: false, error: { message: "Invalid payment signature. Verification failed." } };
            }
        }
        // ----------------------------
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

        // 2. Post-order out-of-stock check
        try {
            const productIds = Array.from(new Set(data.items.map(item => item.id)));
            const { data: productsWithStock } = await supabaseAdmin
                .from("products")
                .select("id, product_variants(stock)")
                .in("id", productIds);

            if (productsWithStock) {
                for (const product of productsWithStock) {
                    const totalStock = (product.product_variants as { stock: number }[])?.reduce((acc, v) => acc + v.stock, 0) || 0;
                    if (totalStock <= 0) {
                        await supabaseAdmin
                            .from("products")
                            .update({
                                out_of_stock_at: new Date().toISOString()
                            })
                            .eq("id", product.id)
                            .is("out_of_stock_at", null); // Only set if not already set
                    }
                }
            }
        } catch (stockErr) {
            console.error("Failed to update out_of_stock_at after order:", stockErr);
            // Non-blocking: continue with order success even if stock tagging fails
        }


        // 3. Sync to Google Sheets (Non-blocking)
        appendOrderToSheet({
            id: orderIdToSave,
            items: data.items,
            customer_details: data.customer_details,
            shipping_address: data.shipping_address,
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
        await verifyActionAuth();
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
        const auth = await verifyActionAuth();
        if (auth.uid !== userId) throw new Error("Forbidden: You can only view your own orders.");
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

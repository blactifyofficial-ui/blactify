"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { appendOrderToSheet } from "./google-sheets";
import { OrderSyncSchema } from "./schemas";
import { z } from "zod";
import { verifyActionAuth } from "./auth-server";
import crypto from "crypto";

// ── Phase 1: Create Pending Order (BEFORE Razorpay gateway opens) ──────────
// This ensures we always have a DB record before payment is attempted.
// If the user pays but the client crashes, the webhook can find this record.

export async function createPendingOrder(orderData: {
    razorpay_order_id: string;
    user_id: string;
    amount: number;
    currency: string;
    items: z.infer<typeof OrderSyncSchema>["items"];
    shipping_address: z.infer<typeof OrderSyncSchema>["shipping_address"];
    customer_details: z.infer<typeof OrderSyncSchema>["customer_details"];
    discount_code?: string;
}, token?: string) {
    try {
        const auth = await verifyActionAuth(token);
        if (auth.uid !== orderData.user_id) {
            return { success: false, error: "Forbidden: You can only create your own orders." };
        }

        // Insert a PENDING order — no stock deduction yet
        const { error } = await supabaseAdmin
            .from("orders")
            .insert({
                id: orderData.razorpay_order_id,
                user_id: orderData.user_id === "guest" ? null : orderData.user_id,
                amount: orderData.amount,
                currency: orderData.currency,
                items: orderData.items,
                status: "pending",
                shipping_address: orderData.shipping_address,
                customer_details: orderData.customer_details,
                payment_details: {
                    discount_code: orderData.discount_code || null,
                    created_at: new Date().toISOString(),
                },
            });

        if (error) {
            // If order already exists (idempotency), treat as success
            if (error.code === "23505") {
                console.log(`Pending order ${orderData.razorpay_order_id} already exists (idempotent).`);
                return { success: true };
            }
            console.error("Failed to create pending order:", error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Pending order created: ${orderData.razorpay_order_id}`);
        return { success: true };
    } catch (err: unknown) {
        console.error("Exception creating pending order:", err);
        return { success: false, error: err instanceof Error ? err.message : "Failed to create pending order" };
    }
}

// ── Phase 2: Confirm Order (AFTER Razorpay payment succeeds) ──────────────
// Verifies payment signature → deducts stock atomically → updates order to "paid"
// This is the critical transaction — stock deduction and order confirmation in one RPC.

export async function confirmOrder(orderData: z.infer<typeof OrderSyncSchema>, token?: string) {
    try {
        const auth = await verifyActionAuth(token);
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
            return { success: false, error: { message: "Forbidden: You can only confirm your own orders." } };
        }

        // --- PAYMENT SIGNATURE VERIFICATION ---
        const razorpay_order_id = data.razorpay_order_id?.trim();
        const razorpay_payment_id = data.razorpay_payment_id?.trim();
        const razorpay_signature = (data.payment_details?.razorpay_signature as string)?.trim();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error("Missing payment verification details:", { razorpay_order_id, razorpay_payment_id, hasSignature: !!razorpay_signature });
            return { success: false, error: { message: "Missing payment verification details." } };
        }

        const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
        if (!key_secret) {
            console.error("RAZORPAY_KEY_SECRET is not configured");
            return { success: false, error: { message: "Payment verification failed: secret missing." } };
        }

        const expected_signature = crypto
            .createHmac("sha256", key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (expected_signature !== razorpay_signature) {
            console.error("Invalid Razorpay signature mismatch.", {
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id,
            });
            return { success: false, error: { message: "Invalid payment signature. Verification failed." } };
        }

        // --- CHECK: Is this order already confirmed? (Idempotency) ---
        const { data: existingOrder } = await supabaseAdmin
            .from("orders")
            .select("status")
            .eq("id", razorpay_order_id)
            .single();

        if (existingOrder?.status === "paid") {
            console.log(`Order ${razorpay_order_id} already confirmed (idempotent).`);
            return { success: true };
        }

        // --- ATOMIC STOCK DEDUCTION via RPC ---
        // This is the ONLY place stock is deducted. The RPC runs as a single
        // Postgres transaction: if any stock check fails, the entire operation
        // rolls back — no partial deductions.
        const { data: rpcData, error } = await supabaseAdmin.rpc('confirm_order_v3', {
            p_order_id: razorpay_order_id,
            p_payment_id: razorpay_payment_id,
            p_payment_details: {
                ...data.payment_details,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            },
            p_items: data.items,
        });

        if (error || !rpcData?.success) {
            const techMessage = error?.message || rpcData?.error || "Unknown error during order confirmation";

            let userMessage = "Failed to complete your purchase. Please try again.";
            if (techMessage.includes("Insufficient stock")) {
                userMessage = techMessage;
            } else if (techMessage.includes("variant not found")) {
                userMessage = "One of the items in your bag is no longer available.";
            } else if (techMessage.includes("not found")) {
                // Pending order record was missing — fall back to create_order_v2
                console.warn(`Pending order ${razorpay_order_id} not found. Falling back to direct creation.`);
                return await fallbackSaveOrder(data);
            }

            return { success: false, error: { message: userMessage, technical: techMessage } };
        }

        // --- POST-CONFIRMATION SIDE EFFECTS (non-blocking) ---

        // 1. Out-of-stock check
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
                            .update({ out_of_stock_at: new Date().toISOString() })
                            .eq("id", product.id)
                            .is("out_of_stock_at", null);
                    }
                }
            }
        } catch (stockErr) {
            console.error("Failed to update out_of_stock_at after order:", stockErr);
        }

        // 2. Admin Push Notification
        const { sendMulticastAdminNotification } = await import("./notifications-server");
        const userEmail = data.customer_details?.email || "Unknown User";
        sendMulticastAdminNotification(
            "🚨 New Order Received!",
            `Order #${razorpay_order_id} for ₹${data.amount} just came in By ${userEmail}`,
            { orderId: razorpay_order_id, type: "new_order" }
        ).catch((err) => console.error("FCM: Trigger error:", err));

        // 3. Google Sheets Sync
        appendOrderToSheet({
            id: razorpay_order_id,
            items: data.items,
            customer_details: data.customer_details,
            shipping_address: data.shipping_address,
            amount: data.amount,
            status: "paid"
        }).catch(() => { });

        console.log(`✅ Order confirmed: ${razorpay_order_id} → paid`);
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

// ── Fallback: Direct save if pending order was somehow missing ──────────────
// This preserves backward compatibility with the original create_order_v2 RPC.
async function fallbackSaveOrder(data: z.infer<typeof OrderSyncSchema>) {
    const orderIdToSave = data.razorpay_order_id || `order_${Date.now()}`;

    const { data: rpcData, error } = await supabaseAdmin.rpc('create_order_v2', {
        p_order_id: orderIdToSave,
        p_user_id: data.user_id,
        p_amount: data.amount,
        p_currency: data.currency,
        p_status: "paid",
        p_shipping_address: data.shipping_address,
        p_customer_details: data.customer_details,
        p_payment_details: data.payment_details || {},
        p_items: data.items
    });

    if (error || !rpcData?.success) {
        const techMessage = error?.message || rpcData?.error || "Fallback order creation failed";
        return { success: false, error: { message: "Failed to save order.", technical: techMessage } };
    }

    // Fire side effects
    const { sendMulticastAdminNotification } = await import("./notifications-server");
    sendMulticastAdminNotification(
        "🚨 New Order Received!",
        `Order #${orderIdToSave} for ₹${data.amount} (fallback save)`,
        { orderId: orderIdToSave, type: "new_order" }
    ).catch(() => { });

    appendOrderToSheet({
        id: orderIdToSave,
        items: data.items,
        customer_details: data.customer_details,
        shipping_address: data.shipping_address,
        amount: data.amount,
        status: "paid"
    }).catch(() => { });

    return { success: true };
}

// ── Legacy wrapper (kept for backward compat) ──────────────────────────────
export async function saveOrder(orderData: z.infer<typeof OrderSyncSchema>, token?: string) {
    return confirmOrder(orderData, token);
}

export async function getOrder(orderId: string, token?: string) {
    try {
        await verifyActionAuth(token);
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

export async function getUserOrders(userId: string, token?: string) {
    try {
        const auth = await verifyActionAuth(token);
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

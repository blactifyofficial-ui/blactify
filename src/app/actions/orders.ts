"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyActionAdminAuth } from "@/lib/auth-server";

interface GetAdminOrdersProps {
    page: number;
    pageSize: number;
    searchTerm?: string;
    token?: string;
}

export async function getAdminOrders({ page, pageSize, searchTerm, token }: GetAdminOrdersProps) {
    try {
        await verifyActionAdminAuth(token);
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

export async function getAdminOrderById(id: string, token?: string) {
    try {
        await verifyActionAdminAuth(token);
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

export async function updateAdminOrder(id: string, updates: Record<string, unknown>, token?: string) {
    try {
        const auth = await verifyActionAdminAuth(token);
        const { data, error } = await supabaseAdmin
            .from("orders")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Log the action
        try {
            const { logAction } = await import("@/lib/logger");
            await logAction({
                action_type: "order_update_status",
                details: { order_id: id, ...updates },
                user_email: auth.email
            });
        } catch (logErr) {
            console.error("Failed to log order update:", logErr);
        }

        return {
            order: data,
            success: true
        };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Update Failed" };
    }
}

export async function getAllOrdersForReport(token?: string) {
    try {
        await verifyActionAdminAuth(token);
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .not("status", "eq", "pending")
            .not("status", "eq", "failed")
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

import Razorpay from "razorpay";
import { appendOrderToSheet } from "@/lib/google-sheets";

export async function syncAdminOrderWithGateway(id: string, token?: string) {
    try {
        const auth = await verifyActionAdminAuth(token);
        
        // 1. Get current order from DB
        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !order) throw new Error("Order not found in the database.");
        if (order.status !== "pending") return { success: true, message: "Order is already updated." };

        // 2. Initialise Razorpay
        const razorpay = new Razorpay({
            key_id: (process.env.RAZORPAY_KEY_ID || "").trim(),
            key_secret: (process.env.RAZORPAY_KEY_SECRET || "").trim(),
        });

        // 3. Fetch status from Gateway
        const razorpayOrder = (await razorpay.orders.fetch(id)) as { status: string };

        if (razorpayOrder.status === "paid") {
            // Fetch payments to get a payment_id
            const payments = (await razorpay.orders.fetchPayments(id)) as { items: Array<{ id: string; status: string }> };
            const successPayment = payments.items.find((p: { status: string }) => p.status === "captured");

            if (!successPayment) {
                throw new Error("Payment was successful but couldn't be found in the gateway.");
            }

            // Manually confirm via internal logic (without signature check since we trust our own API call)
            const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('confirm_order_v3', {
                p_order_id: id,
                p_payment_id: successPayment.id,
                p_payment_details: {
                    ...successPayment,
                    reconciled_by: auth.email,
                    reconciled_at: new Date().toISOString()
                },
                p_items: order.items
            });

            if (rpcError || !rpcData?.success) {
                throw new Error(rpcError?.message || rpcData?.error || "Failed to finalize order update.");
            }

            return { success: true, message: "Order successfully synced with Razorpay." };
        } else {
            return { success: false, error: `Gateway status is ${razorpayOrder.status.toUpperCase()}. Sync halted.` };
        }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : "Synchronization failed." };
    }
}

export async function testSheetSync(token?: string) {
    try {
        await verifyActionAdminAuth(token);
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

export async function registerAdminOrderShipping(id: string, token?: string) {
    try {
        const { verifyActionAdminAuth } = await import("@/lib/auth-server");
        await verifyActionAdminAuth(token);
        
        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !order) throw new Error("Order not found.");

        const { processOrderShipping } = await import("@/actions/delhivery");
        const shippingResult = await processOrderShipping(order);

        if (shippingResult.success) {
            await supabaseAdmin
                .from("orders")
                .update({
                    tracking_id: shippingResult.awb,
                    payment_details: {
                        ...((order.payment_details as Record<string, unknown>) || {}),
                        shipping: {
                            awb: shippingResult.awb,
                            tracking_link: shippingResult.tracking_link,
                            label_url: shippingResult.label_url,
                            status: "registered",
                            registered_at: new Date().toISOString()
                        }
                    }
                })
                .eq("id", id);
            
            return { success: true, message: "Shipment registered successfully", awb: shippingResult.awb };
        } else {
            throw new Error(shippingResult.message || "Delhivery registration failed.");
        }
    } catch (err: unknown) {
        console.error("Shipping Registration Error:", err);
        return { success: false, error: err instanceof Error ? err.message : "Registration failed" };
    }
}



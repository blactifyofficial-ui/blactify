import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("X-Razorpay-Signature");

        if (!signature || !body) {
            return NextResponse.json({ error: "No signature or body provided" }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
            return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
        }

        const isValid = Razorpay.validateWebhookSignature(body, signature, secret);

        if (!isValid) {
            console.error("Invalid Webhook Signature mismatch");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        console.log("Razorpay Webhook Event:", event.event);

        // Handle specific events
        if (event.event === "order.paid" || event.event === "payment.captured") {
            const payload = event.payload.order ? event.payload.order.entity : event.payload.payment.entity;
            const order_id = payload.order_id || payload.id;
            const payment_id = payload.payment_id || payload.id;

            console.log(`Processing ${event.event} for order: ${order_id}`);

            // 1. Check if order exists and its current status
            const { data: existingOrder, error: fetchError } = await supabaseAdmin
                .from("orders")
                .select("status, items")
                .eq("id", order_id)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") {
                console.error("Error fetching order in webhook:", fetchError);
            }

            if (existingOrder) {
                if (existingOrder.status === "paid") {
                    // Already confirmed by client-side — nothing to do
                    console.log(`Order ${order_id} is already marked as paid.`);
                } else if (existingOrder.status === "pending") {
                    // ⚡ CRITICAL: Client-side confirmOrder failed or hasn't run yet.
                    // The pending order exists but wasn't confirmed — we must do it now.
                    console.log(`⚠️ Order ${order_id} is still PENDING. Confirming via webhook...`);

                    const items = existingOrder.items as { id: string; size: string; quantity: number; price_base: number; price_offer?: number }[];

                    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('confirm_order_v3', {
                        p_order_id: order_id,
                        p_payment_id: payment_id,
                        p_payment_details: {
                            razorpay_order_id: order_id,
                            razorpay_payment_id: payment_id,
                            confirmed_by: "webhook",
                            webhook_event: event.event,
                            confirmed_at: new Date().toISOString(),
                        },
                        p_items: items,
                    });

                    if (rpcError || !rpcData?.success) {
                        console.error(`Failed to confirm order ${order_id} via webhook:`, rpcError?.message || rpcData?.error);

                        // Last resort: just update status to paid so the order isn't lost
                        const { error: updateError } = await supabaseAdmin
                            .from("orders")
                            .update({
                                status: "paid",
                                payment_id: payment_id,
                                payment_details: {
                                    razorpay_order_id: order_id,
                                    razorpay_payment_id: payment_id,
                                    confirmed_by: "webhook_fallback",
                                    error: rpcError?.message || rpcData?.error,
                                    confirmed_at: new Date().toISOString(),
                                },
                            })
                            .eq("id", order_id);

                        if (updateError) {
                            console.error(`CRITICAL: Could not even fallback-update order ${order_id}:`, updateError);
                        } else {
                            console.log(`Order ${order_id} marked as paid via webhook fallback (stock may not be deducted).`);
                        }
                    } else {
                        console.log(`✅ Order ${order_id} confirmed via webhook successfully.`);

                        // Send admin notification since client-side didn't do it
                        try {
                            const { sendMulticastAdminNotification } = await import("@/lib/notifications-server");
                            const { data: orderData } = await (supabaseAdmin
                                .from("orders")
                                .select("*")
                                .eq("id", order_id)
                                .single() as any);

                            if (orderData) {
                                const customerEmail = (orderData.customer_details as { email?: string })?.email || "Unknown";
                                const totalAmountFormatted = `₹${Number(orderData.amount).toLocaleString('en-IN')}`;
                                
                                // Push Notification
                                sendMulticastAdminNotification(
                                    "🚨 Order Confirmed via Webhook!",
                                    `Order #${order_id} for ${totalAmountFormatted} by ${customerEmail} (webhook confirmation)`,
                                    { orderId: order_id, type: "new_order" }
                                ).catch(() => { });

                                // Email & Telegram Notifications (Direct Call)
                                const { sendOrderNotifications } = await import("@/lib/notifications-emails");
                                sendOrderNotifications({ ...orderData, id: order_id }).catch(e => console.error("Webhook Order Notify Error:", e));
                            }
                        } catch {
                            // Non-blocking
                        }
                    }
                }
            } else {
                // Order doesn't exist at all — this shouldn't happen with two-phase commit
                // but log it prominently for debugging
                console.error(`🔴 CRITICAL: Order ${order_id} not found in database at all! Payment was captured but no pending order exists.`);
                console.error(`Payment ID: ${payment_id}, Event: ${event.event}`);
                console.error("Notes:", JSON.stringify(payload.notes || {}));
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: unknown) {
        console.error("Webhook processing error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

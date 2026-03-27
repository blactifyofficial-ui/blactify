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
        const eventType = event.event;


        // --- Audit log for receipt ---
        await supabaseAdmin.from("developer_logs").insert({
            action_type: `razorpay_webhook_${eventType}`,
            severity: "info",
            details: {
                event: eventType,
                razorpay_order_id: event.payload.order?.entity?.id || event.payload.payment?.entity?.order_id,
                payment_id: event.payload.payment?.entity?.id,
                timestamp: new Date().toISOString()
            }
        });

        // Handle specific events
        if (eventType === "order.paid" || eventType === "payment.captured") {
            const payload = event.payload.order ? event.payload.order.entity : event.payload.payment.entity;
            const order_id = payload.order_id || payload.id;
            const payment_id = payload.payment_id || payload.id;
            const notes = payload.notes || {};



            // 1. Check if order exists and its current status
            const { data: existingOrder, error: fetchError } = await supabaseAdmin
                .from("orders")
                .select("status, items")
                .eq("id", order_id)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") {
                console.error("Error fetching order in webhook:", fetchError);
                await supabaseAdmin.from("developer_logs").insert({
                    action_type: "razorpay_webhook_fetch_error",
                    severity: "error",
                    details: { order_id, error: fetchError, timestamp: new Date().toISOString() }
                });
            }

            if (existingOrder) {
                if (existingOrder.status === "paid") {
                    // Already confirmed by client-side - nothing to do

                } else {
                    // ⚡ CRITICAL: Client-side confirmOrder failed or hasn't run yet.


                    const items = existingOrder.items as { id: string; size: string; quantity: number; price_base: number; price_offer?: number }[];

                    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('confirm_order_v3', {
                        p_order_id: order_id,
                        p_payment_id: payment_id,
                        p_payment_details: {
                            razorpay_order_id: order_id,
                            razorpay_payment_id: payment_id,
                            confirmed_by: "webhook",
                            webhook_event: eventType,
                            confirmed_at: new Date().toISOString(),
                            razorpay_notes: notes,
                        },
                        p_items: items,
                    });

                    if (rpcError || !rpcData?.success) {
                        const errMsg = rpcError?.message || rpcData?.error;
                        console.error(`Failed to confirm order ${order_id} via webhook:`, errMsg);

                        await supabaseAdmin.from("developer_logs").insert({
                            action_type: "razorpay_webhook_confirmation_failed",
                            severity: "error",
                            details: { order_id, error: errMsg, timestamp: new Date().toISOString() }
                        });

                        // Last resort: just update status to paid so the order record isn't lost
                        const { error: updateError } = await supabaseAdmin
                            .from("orders")
                            .update({
                                status: "paid",
                                payment_id: payment_id,
                                payment_details: {
                                    razorpay_order_id: order_id,
                                    razorpay_payment_id: payment_id,
                                    confirmed_by: "webhook_fallback",
                                    error: errMsg,
                                    confirmed_at: new Date().toISOString(),
                                    razorpay_notes: notes,
                                },
                            })
                            .eq("id", order_id);

                        if (updateError) {
                            console.error(`CRITICAL: Could not even fallback-update order ${order_id}:`, updateError);
                        }
                    } else {

                        // Audit success
                        await supabaseAdmin.from("developer_logs").insert({
                            action_type: "razorpay_webhook_confirmation_success",
                            severity: "info",
                            details: { order_id, payment_id, timestamp: new Date().toISOString() }
                        });

                        // Send notifications
                        try {
                            const { sendMulticastAdminNotification } = await import("@/lib/notifications-server");
                            const { data: orderData } = (await supabaseAdmin
                                .from("orders")
                                .select("*")
                                .eq("id", order_id)
                                .single()) as { data: Record<string, unknown> | null; error: unknown };

                            if (orderData) {
                                const customerEmail = (orderData.customer_details as { email?: string })?.email || "Unknown";
                                const totalAmountFormatted = `₹${Number(orderData.amount).toLocaleString('en-IN')}`;
                                
                                sendMulticastAdminNotification(
                                    "🚨 Order Confirmed via Webhook!",
                                    `Order #${order_id} for ${totalAmountFormatted} by ${customerEmail} (webhook confirmation)`,
                                    { orderId: order_id, type: "new_order" }
                                ).catch(() => { });

                                const { sendOrderNotifications } = await import("@/lib/notifications-emails");
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                sendOrderNotifications({ ...orderData, id: order_id } as any).catch(e => console.error("Webhook Order Notify Error:", e));
                            }
                        } catch { /* Non-blocking */ }
                    }
                }
            } else {
                // Order doesn't exist at all — this shouldn't happen with the Phase 1 registration
                console.error(`🔴 CRITICAL: Order ${order_id} not found in database! Payment was captured but no record exists.`);
                
                await supabaseAdmin.from("developer_logs").insert({
                    action_type: "razorpay_webhook_missing_order_record",
                    severity: "critical",
                    details: {
                        razorpay_order_id: order_id,
                        payment_id: payment_id,
                        event: eventType,
                        razorpay_notes: notes,
                        amount: payload.amount / 100, // back to currency
                        currency: payload.currency,
                        timestamp: new Date().toISOString(),
                        notes_hint: "Check Razorpay dashboard for this order ID to manually recover data."
                    }
                });
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: unknown) {
        console.error("Razorpay webhook error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { processOrderShipping } from "@/actions/delhivery";

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
                .select("*")
                .eq("id", order_id)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") {
                console.error("Error fetching order in webhook:", fetchError);
            }

            if (existingOrder) {
                let currentOrderData = existingOrder;
                
                if (existingOrder.status !== "paid") {
                    // ⚡ CRITICAL: Confirm order if not already paid
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
                        console.error(`Failed to confirm order ${order_id} via webhook:`, rpcError?.message || rpcData?.error);
                    } else {
                        // Audit success
                        await supabaseAdmin.from("developer_logs").insert({
                            action_type: "razorpay_webhook_confirmation_success",
                            severity: "info",
                            details: { order_id, payment_id, timestamp: new Date().toISOString() }
                        });

                        // Fetch fresh order data for shipping & notifications
                        const { data: refreshedOrder } = await supabaseAdmin
                            .from("orders")
                            .select("*")
                            .eq("id", order_id)
                            .single();
                        
                        if (refreshedOrder) {
                            currentOrderData = refreshedOrder;
                            // 1. Send Notifications
                            try {
                                const { sendOrderNotifications } = await import("@/lib/notifications-emails");
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                sendOrderNotifications({ ...refreshedOrder, id: order_id } as any).catch(e => console.error("Webhook Order Notify Error:", e));
                            } catch (e) {
                                console.error("Notification error:", e);
                            }
                        }
                    }
                } else {
                    // Order already paid (likely by client-side confirmOrder script), 
                    // ensure we have the most up-to-date record from DB for automation checks.
                    const { data: latestOrder } = await supabaseAdmin
                        .from("orders")
                        .select("*")
                        .eq("id", order_id)
                        .single();
                    if (latestOrder) {
                        currentOrderData = latestOrder;
                    }
                }

                // --- AUTOMATION: Trigger Delhivery Shipping if not already registered ---
                // We check if tracking_id is missing to avoid double registration.
                if (currentOrderData && (currentOrderData.status === "paid" || currentOrderData.status === "processing") && !currentOrderData.tracking_id) {
                    try {
                        console.log(`[Webhook] Registering Delhivery shipment for paid order ${order_id}`);
                        const shippingResult = await processOrderShipping(currentOrderData);

                        if (shippingResult.success) {
                            await supabaseAdmin
                                .from("orders")
                                .update({
                                    tracking_id: shippingResult.awb,
                                    payment_details: {
                                        ...((currentOrderData.payment_details as Record<string, unknown>) || {}),
                                        shipping: {
                                            awb: shippingResult.awb,
                                            tracking_link: shippingResult.tracking_link,
                                            label_url: shippingResult.label_url,
                                            status: "registered",
                                            registered_at: new Date().toISOString()
                                        }
                                    }
                                })
                                .eq("id", order_id);
                            console.log(`[Webhook] Delhivery shipment registered: ${shippingResult.awb}`);
                        } else {
                            console.warn("[Webhook] Delhivery registration failed:", shippingResult.message);
                        }
                    } catch (shippingErr) {
                        console.error("[Webhook] Delhivery processing error:", shippingErr);
                    }
                }
            } else {
                console.error(`🔴 CRITICAL: Order ${order_id} not found in database!`);
            }
        } else if (eventType === "payment.failed") {
            const payload = event.payload.payment.entity;
            const order_id = payload.order_id;
            if (order_id) {
                await supabaseAdmin
                    .from("orders")
                    .update({ status: "unpaid" })
                    .eq("id", order_id)
                    .in("status", ["pending", "unpaid"]); 
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: unknown) {
        console.error("Razorpay webhook error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

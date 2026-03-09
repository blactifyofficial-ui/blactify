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

            // 1. Check if order exists and update its status
            const { data: existingOrder, error: fetchError } = await supabaseAdmin
                .from("orders")
                .select("status")
                .eq("id", order_id)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") {
                console.error("Error fetching order in webhook:", fetchError);
            }

            if (existingOrder) {
                if (existingOrder.status !== "paid") {
                    const { error: updateError } = await supabaseAdmin
                        .from("orders")
                        .update({
                            status: "paid",
                            payment_id: payment_id,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", order_id);

                    if (updateError) {
                        console.error("Failed to update order status via webhook:", updateError);
                    } else {
                        console.log(`Order ${order_id} marked as paid via webhook.`);
                    }
                } else {
                    console.log(`Order ${order_id} is already marked as paid.`);
                }
            } else {
                // If the order doesn't exist yet, it means the client-side saveOrder hasn't run.
                // In a more complex setup, we would try to create the order here if we had the context (stored in notes).
                console.warn(`Order ${order_id} not found in database. The client-side sync may still be in progress or failed.`);

                // NEW: We can try to get the metadata/notes from the payload if we start sending it.
                // For now, we at least log it.
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: unknown) {
        console.error("Webhook processing error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

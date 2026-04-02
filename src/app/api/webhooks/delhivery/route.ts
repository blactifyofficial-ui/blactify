import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Delhivery Webhook Handler
 * Endpoint: /api/webhooks/delhivery
 * This receives real-time scan updates from Delhivery and updates the local order status.
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("[Delhivery Webhook] Received update:", JSON.stringify(body));

        // Delhivery payload can be a single scan or an array of scans
        const scans = Array.isArray(body) ? body : [body];

        for (const update of scans) {
            const shipment = update.Shipment || update;
            const awb = shipment.AWB || shipment.waybill;
            const statusInfo = shipment.Status || {};
            const delhiStatus = (statusInfo.Status || statusInfo.status || "").toLowerCase();
            const statusType = (statusInfo.StatusType || statusInfo.status_type || "").toUpperCase();

            if (!awb) continue;

            console.log(`[Delhivery Webhook] Processing AWB: ${awb}, Status: ${delhiStatus} (${statusType})`);

            // Map Delhivery status to internal order status
            let internalStatus: string | null = null;

            if (delhiStatus.includes("delivered")) {
                internalStatus = "delivered";
            } else if (
                delhiStatus.includes("manifested") || 
                delhiStatus.includes("in transit") || 
                delhiStatus.includes("dispatched") ||
                delhiStatus.includes("picked up") ||
                statusType === "UD" || // Manifested
                statusType === "IT"    // In Transit
            ) {
                internalStatus = "shipped";
            } else if (
                delhiStatus.includes("returned") || 
                delhiStatus.includes("rto") || 
                delhiStatus.includes("cancelled")
            ) {
                internalStatus = "failed";
            }

            if (internalStatus) {
                console.log(`[Delhivery Webhook] Updating order for AWB ${awb} to: ${internalStatus}`);
                
                const { error: updateError } = await supabaseAdmin
                    .from("orders")
                    .update({ 
                        status: internalStatus,
                        // Update tracking_details with the latest scan info
                        tracking_details: {
                            carrier: "Delhivery",
                            tracking_id: awb,
                            tracking_url: `https://p.delhivery.com/track/package/${awb}`,
                            last_status: delhiStatus,
                            last_location: statusInfo.StatusLocation || "",
                            updated_at: new Date().toISOString()
                        }
                    })
                    .eq("tracking_id", awb);

                if (updateError) {
                    console.error(`[Delhivery Webhook] DB Update error for AWB ${awb}:`, updateError);
                }
            }
        }

        // Always return 200 OK within 500ms as per Delhivery requirements
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error("[Delhivery Webhook] Processing failed:", err);
        // Still return 200 to avoid Delhivery retrying a bad payload, but log it locally
        return NextResponse.json({ success: false }, { status: 200 });
    }
}

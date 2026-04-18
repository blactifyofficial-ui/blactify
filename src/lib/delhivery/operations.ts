import { Order } from '@/types/database';
import { fetchWaybillInternal, createShipmentInternal } from './shipments';

export async function processOrderShippingInternal(order: Order) {
    if (!order) return { success: false, message: "No order provided" };

    const AWB_RESULT = await fetchWaybillInternal(1);
    if (!AWB_RESULT.success || !AWB_RESULT.waybills || AWB_RESULT.waybills.length === 0) {
        return { success: false, message: "Failed to allocate AWB", details: AWB_RESULT.message };
    }

    const awb = AWB_RESULT.waybills[0];
    const originPin = process.env.DELHIVERY_ORIGIN_PINCODE || "673638";
    const shopName = process.env.DELHIVERY_WAREHOUSE_NAME || "Blactify Studio";

    const shipmentData = {
        shipments: [
            {
                name: String(`${order.shipping_address?.firstName || ""} ${order.shipping_address?.lastName || ""}`.trim() || order.customer_details?.name || "Customer").substring(0, 50),
                add: String(`${order.shipping_address?.address || ""} ${order.shipping_address?.apartment || ""}`.trim() || "No Address Provided").substring(0, 150),
                pin: String(order.shipping_address?.pincode || ""),
                phone: String(order.customer_details?.phone || order.shipping_address?.phone || ""),
                order: order.id,
                payment_mode: "Pre-paid",
                products_desc: (order.items || []).map((i) => `${i.name} (x${i.quantity})`).join(", ").substring(0, 60),
                cod_amount: "0",
                order_date: new Date(order.created_at || Date.now()).toISOString(),
                total_amount: order.amount.toString(),
                seller_name: shopName,
                waybill: awb,
                quantity: (order.items || []).reduce((acc, i) => acc + i.quantity, 0).toString() || "1",
                weight: "500",
                city: order.shipping_address?.city || "",
                state: order.shipping_address?.state || "",
                country: "India"
            }
        ],
        pickup_location: {
            name: shopName,
            add: "Blactify Studio, Kozhikode, Kerala",
            phone: "9207965510",
            pin: originPin
        }
    };

    const SHIPMENT_RESULT = await createShipmentInternal(shipmentData);

    if (SHIPMENT_RESULT.success) {
        const trackingUrl = `https://www.delhivery.com/tracking`;

        return { 
            success: true, 
            awb, 
            tracking_link: trackingUrl, 
            shipment_details: SHIPMENT_RESULT.data
        };
    }

    return { success: false, message: "Shipment registration failed in Delhivery", details: SHIPMENT_RESULT.message };
}

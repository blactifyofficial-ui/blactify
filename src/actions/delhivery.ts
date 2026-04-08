"use server";

import { 
    checkPincodeServiceabilityInternal, 
    getShippingChargesInternal, 
    fetchWaybillInternal, 
    createShipmentInternal, 
    generateLabelInternal, 
    requestPickupInternal, 
    trackShipmentInternal,
    processOrderShippingInternal
} from "@/lib/delhivery-service";
import { Order } from "@/types/database";

/**
 * Server side actions for Delhivery integration.
 * These wrap the internal service logic to be reachable from the client.
 */

export async function checkPincodeServiceability(pincode: string) {
    return await checkPincodeServiceabilityInternal(pincode);
}

export async function getShippingCharges(destinationPincode: string, weightGrams: number = 500, originPincode?: string) {
    return await getShippingChargesInternal(destinationPincode, weightGrams, originPincode);
}

export async function fetchWaybill(count: number = 1) {
    return await fetchWaybillInternal(count);
}

export async function createShipment(shipmentData: Record<string, unknown>) {
    return await createShipmentInternal(shipmentData);
}

export async function generateLabel(waybills: string) {
    return await generateLabelInternal(waybills);
}

export async function requestPickup(pickupData: Record<string, unknown>) {
    return await requestPickupInternal(pickupData);
}

export async function trackShipment(waybill: string) {
    return await trackShipmentInternal(waybill);
}

export async function processOrderShipping(order: Order) {
    return await processOrderShippingInternal(order);
}

export async function alertAdminLowWalletBalance(errorMessage: string) {
    try {
        const { sendMulticastAdminNotification } = await import("@/lib/notifications-server");
        await sendMulticastAdminNotification(
            "⚠️ Delhivery Wallet Issue",
            `Shipping API returned an error, likely low wallet balance. Gateway blocked. Details: ${errorMessage}`,
            { type: "wallet_alert" }
        );
        return { success: true };
    } catch (error) {
        console.error("Failed to send wallet alert:", error);
        return { success: false };
    }
}

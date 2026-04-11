import { DelhiveryResponse } from './types';
import { delhiveryRequest } from './client';

export async function checkPincodeServiceabilityInternal(pincode: string): Promise<DelhiveryResponse> {
    if (!pincode || pincode.length !== 6) {
        return { success: false, message: "Invalid PIN code format" };
    }

    const result = await delhiveryRequest('GET', '/c/api/pin-codes/json/', { filter_codes: pincode });

    if (result.success && result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        const deliveryCodes = data.delivery_codes;
        if (Array.isArray(deliveryCodes) && deliveryCodes.length > 0) {
            const firstEntry = deliveryCodes[0] as Record<string, unknown>;
            const info = (firstEntry.postal_code || firstEntry) as Record<string, unknown>;
            const isServiceable = 
                info.is_serviceable === "yes" || 
                info.is_serviceable === true ||
                info.pre_paid === "Y" || 
                info.cod === "Y" ||
                info.pickup === "Y";

            if (isServiceable) return { success: true, message: "Serviceable", data: info };
        }
        return { success: false, message: "Pincode is not serviceable by Delhivery." };
    }
    return result;
}

export async function getShippingChargesInternal(destinationPincode: string, weightGrams: number = 500, originPincode: string = process.env.DELHIVERY_ORIGIN_PINCODE || "673638"): Promise<{ success: boolean; charge?: number; metadata?: unknown; message?: string; fallbackCharge?: number }> {
    if (!destinationPincode || destinationPincode.length !== 6) {
        return { success: false, message: "Invalid destination PIN code" };
    }

    const result = await delhiveryRequest('GET', '/api/kinko/v1/invoice/charges/.json', {
        md: 'E',
        ss: 'Delivered',
        d_pin: destinationPincode,
        o_pin: originPincode,
        cgm: String(weightGrams),
        pt: 'Pre-paid'
    });

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const chargeInfo = result.data[0] as Record<string, unknown>;
        const totalCharge = parseFloat(String(chargeInfo.total_amount || chargeInfo.total_charge || 0));
        if (totalCharge > 0) return { success: true, charge: totalCharge, metadata: chargeInfo };
    }

    return { 
        success: false, 
        message: "Failed to calculate shipping charges automatically",
        fallbackCharge: destinationPincode.startsWith('6') ? 59 : 79 
    };
}

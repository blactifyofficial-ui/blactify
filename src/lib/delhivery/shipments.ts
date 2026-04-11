import { DelhiveryResponse } from './types';
import { delhiveryRequest } from './client';

export async function fetchWaybillInternal(count: number = 1): Promise<DelhiveryResponse> {
    const result = await delhiveryRequest('GET', '/waybill/api/fetch/json/', { count: String(count) });
    if (result.success && typeof result.data === 'string') {
        const waybills = result.data.split(',').filter(w => w.trim().length > 0);
        return { success: true, waybills };
    }
    return result;
}

export async function createShipmentInternal(shipmentData: Record<string, unknown>): Promise<DelhiveryResponse> {
    const payload = `format=json&data=${JSON.stringify(shipmentData)}`;
    const result = await delhiveryRequest('POST', '/api/cmu/create.json', payload, { isFormData: true });
    
    if (result.success && result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        const packages = data.packages as Array<Record<string, unknown>>;
        if (data.success || (Array.isArray(packages) && packages.length > 0 && packages[0].status === "Success")) {
            return { success: true, data };
        }
        return { success: false, message: (Array.isArray(packages) && packages.length > 0 ? String(packages[0].remarks) : "Shipment creation failed."), data };
    }
    return result;
}

export async function requestPickupInternal(pickupData: Record<string, unknown>): Promise<DelhiveryResponse> {
    return await delhiveryRequest('POST', '/fm/request/pickup/json/', pickupData);
}

export async function trackShipmentInternal(waybill: string): Promise<DelhiveryResponse> {
    const result = await delhiveryRequest('GET', '/api/v1/packages/json/', { waybill });
    if (result.success && result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        const shipmentData = data.ShipmentData as Array<Record<string, unknown>>;
        if (Array.isArray(shipmentData) && shipmentData.length > 0) {
            return { success: true, data: shipmentData[0] };
        }
    }
    return { success: false, message: "Shipment not found or tracking unavailable." };
}

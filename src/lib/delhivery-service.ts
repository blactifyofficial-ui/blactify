import axios, { AxiosRequestConfig } from 'axios';
import { Order } from '@/types/database';

const DELHI_VERY_TOKEN = process.env.DELHIVERY_TOKEN || '';
const PRODUCTION_BASE_URL = 'https://track.delhivery.com';
const STAGING_BASE_URL = 'https://staging-express.delhivery.com';

/**
 * Common helper to make Delhivery API requests with multiple auth formats and retry logic.
 */
interface DelhiveryResponse {
    success: boolean;
    data?: Record<string, unknown> | string;
    message?: string;
    details?: unknown;
    waybills?: string[];
    packages?: Array<Record<string, unknown>>;
}

async function delhiveryRequest(
    method: 'GET' | 'POST', 
    endpoint: string, 
    dataOrParams: Record<string, unknown> | string = {}, 
    options: { isFormData?: boolean } = {}
): Promise<DelhiveryResponse> {
    if (!DELHI_VERY_TOKEN) {
        return { success: false, message: "Shipping service is currently unavailable.", details: "Delhivery Token is missing in environment variables." };
    }

    const urls = [PRODUCTION_BASE_URL, STAGING_BASE_URL];
    const authFormats = [
        (t: string) => t,
        (t: string) => `Token ${t}`,
        (t: string) => `Bearer ${t}`,
    ];

    let lastError: unknown = null;

    for (const baseUrl of urls) {
        for (const format of authFormats) {
            const authHeader = format(DELHI_VERY_TOKEN);
            const url = `${baseUrl}${endpoint}`;
            
            try {
                const config: AxiosRequestConfig = {
                    method,
                    url,
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': options.isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
                    },
                    timeout: 30000,
                };

                if (method === 'GET') {
                    config.params = dataOrParams;
                } else {
                    config.data = dataOrParams;
                }

                const response = await axios(config);
                const respData = response.data;

                const isErrorString = typeof respData === 'string' && respData.toLowerCase().includes("error");
                const isErrorObject = typeof respData === 'object' && respData !== null && 
                    ((respData as Record<string, unknown>).status === "Error" || (respData as Record<string, unknown>).success === false);

                if (isErrorString || isErrorObject) {
                    throw new Error(typeof respData === 'string' ? respData : JSON.stringify(respData));
                }

                return { success: true, data: respData };
            } catch (err: unknown) {
                lastError = err;
                if (axios.isAxiosError(err)) {
                    const status = err.response?.status;
                    if (status === 404 && baseUrl === PRODUCTION_BASE_URL) break;
                }
            }
        }
    }

    let errorMessage = "Unknown error";
    let status: number | undefined;

    if (axios.isAxiosError(lastError)) {
        status = lastError.response?.status;
        errorMessage = String(lastError.response?.data || lastError.message);
        if (lastError.code === 'ECONNABORTED') {
            return { success: false, message: "Delhivery API request timed out." };
        }
    } else if (lastError instanceof Error) {
        errorMessage = lastError.message;
    }

    if (status === 401 || status === 403) {
        return { success: false, message: "Something went wrong. Please try again later.", details: errorMessage };
    }

    return { success: false, message: "Something went wrong. Please try again later.", details: errorMessage };
}

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

export async function generateLabelInternal(waybills: string): Promise<DelhiveryResponse> {
    const result = await delhiveryRequest('GET', '/api/p/packagelist', { wbns: waybills });
    if (result.success && result.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        const packages = data.packages as Array<Record<string, unknown>>;
        if (Array.isArray(packages) && packages.length > 0) {
            return { success: true, packages };
        }
    }
    return { success: false, message: "Failed to generate label.", details: result.data };
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

export async function processOrderShippingInternal(order: Order) {
    if (!order) return { success: false, message: "No order provided" };

    const AWB_RESULT = await fetchWaybillInternal(1);
    if (!AWB_RESULT.success || !AWB_RESULT.waybills || AWB_RESULT.waybills.length === 0) {
        return { success: false, message: "Failed to allocate AWB", details: AWB_RESULT.message };
    }

    const awb = AWB_RESULT.waybills[0];
    const originPin = process.env.DELHIVERY_ORIGIN_PINCODE || "673638";
    const shopName = process.env.DELHIVERY_WAREHOUSE_NAME || "Blactify";

    const shipmentData = {
        shipments: [
            {
                name: String(`${order.shipping_address?.firstName || ""} ${order.shipping_address?.lastName || ""}`.trim() || order.customer_details?.name || "Customer").substring(0, 50),
                add: String(`${order.shipping_address?.address || ""} ${order.shipping_address?.apartment || ""}`.trim() || "No Address Provided").substring(0, 150),
                pin: String(order.shipping_address?.pincode || ""),
                phone: String(order.customer_details?.phone || order.shipping_address?.phone || ""),
                order: order.id,
                payment_mode: "Pre-paid",
                products_desc: (order.items || []).map((i) => `${i.name} (x${i.quantity})`).join(", "),
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
            add: "Blactify Warehouse, Kozhikode, Kerala",
            phone: "9188484192",
            pin: originPin
        }
    };

    const SHIPMENT_RESULT = await createShipmentInternal(shipmentData);

    if (SHIPMENT_RESULT.success) {
        const trackingUrl = `https://track.delhivery.com/tracking/track?id=${awb}`;
        const labelInfo = await generateLabelInternal(awb);

        return { 
            success: true, 
            awb, 
            tracking_link: trackingUrl, 
            label_url: labelInfo.success && labelInfo.packages?.[0] ? String(labelInfo.packages[0].pdf_url) : null,
            shipment_details: SHIPMENT_RESULT.data
        };
    }

    return { success: false, message: "Shipment registration failed in Delhivery", details: SHIPMENT_RESULT.message };
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

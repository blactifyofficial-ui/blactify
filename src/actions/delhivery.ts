"use server";

import axios from 'axios';

const DELHI_VERY_TOKEN = process.env.DELHIVERY_TOKEN || '';
const PRODUCTION_BASE_URL = 'https://track.delhivery.com';
const STAGING_BASE_URL = 'https://staging-express.delhivery.com';

/**
 * Common helper to make Delhivery API requests with multiple auth formats and retry logic.
 */
interface DelhiveryResponse {
    success: boolean;
    data?: any;
    message?: string;
    details?: any;
    waybills?: string[];
    packages?: any[];
}

async function delhiveryRequest(method: 'GET' | 'POST', endpoint: string, dataOrParams: any = {}, options: any = {}): Promise<DelhiveryResponse> {
    if (!DELHI_VERY_TOKEN) {
        return { success: false, message: "Delhivery Token is missing in environment variables." };
    }

    const urls = [PRODUCTION_BASE_URL, STAGING_BASE_URL];
    const authFormats = [
        (t: string) => t,
        (t: string) => `Token ${t}`,
        (t: string) => `Bearer ${t}`,
    ];

    let lastError: any = null;

    for (const baseUrl of urls) {
        for (const format of authFormats) {
            const authHeader = format(DELHI_VERY_TOKEN);
            const url = `${baseUrl}${endpoint}`;
            
            try {
                const config: any = {
                    method,
                    url,
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': options.isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
                    },
                    timeout: 30000,
                    ...options
                };

                if (method === 'GET') config.params = dataOrParams;
                else config.data = dataOrParams;

                const response = await axios(config);
                const respData = response.data;

                // Improved safety for Delhivery weird responses (they often return 200 with error text)
                const isErrorString = typeof respData === 'string' && respData.toLowerCase().includes("error");
                const isErrorObject = typeof respData === 'object' && respData !== null && (respData.status === "Error" || respData.success === false);

                if (isErrorString || isErrorObject) {
                    throw new Error(typeof respData === 'string' ? respData : JSON.stringify(respData));
                }

                return { success: true, data: respData };
            } catch (err: any) {
                lastError = err;
                const status = err.response?.status;
                if (status === 404 && baseUrl === PRODUCTION_BASE_URL) break;
            }
        }
    }

    const status = lastError?.response?.status;
    const errorMessage = lastError?.response?.data || lastError?.message || "Unknown error";

    if (status === 401 || status === 403) {
        return { success: false, message: "API Authentication failed. Please check your Delhivery Token.", details: errorMessage };
    }
    if (lastError?.code === 'ECONNABORTED') {
        return { success: false, message: "Delhivery API request timed out. Their servers might be slow." };
    }

    return { success: false, message: "Delhivery API request failed.", details: errorMessage };
}

export async function checkPincodeServiceability(pincode: string): Promise<DelhiveryResponse> {
    if (!pincode || pincode.length !== 6) {
        return { success: false, message: "Invalid PIN code format" };
    }

    const result = await delhiveryRequest('GET', '/c/api/pin-codes/json/', { filter_codes: pincode });

    if (result.success) {
        const data = result.data;
        if (data.delivery_codes && data.delivery_codes.length > 0) {
            const info = data.delivery_codes[0].postal_code || data.delivery_codes[0];
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

export async function fetchWaybill(count: number = 1): Promise<DelhiveryResponse> {
    const result = await delhiveryRequest('GET', '/waybill/api/fetch/json/', { count });
    if (result.success && typeof result.data === 'string') {
        const waybills = result.data.split(',').filter(w => w.trim().length > 0);
        return { success: true, waybills };
    }
    return result;
}

export async function createShipment(shipmentData: any): Promise<DelhiveryResponse> {
    const payload = `format=json&data=${JSON.stringify(shipmentData)}`;
    const result = await delhiveryRequest('POST', '/api/cmu/create.json', payload, { isFormData: true });
    
    if (result.success) {
        const data = result.data;
        if (data.success || (data.packages && data.packages[0]?.status === "Success")) {
            return { success: true, data };
        }
        return { success: false, message: data.packages?.[0]?.remarks || "Shipment creation failed.", data };
    }
    return result;
}

export async function generateLabel(waybills: string): Promise<DelhiveryResponse> {
    const result = await delhiveryRequest('GET', '/api/p/packagelist', { wbns: waybills });
    if (result.success && result.data.packages?.length > 0) {
        return { success: true, packages: result.data.packages };
    }
    return { success: false, message: "Failed to generate label.", details: result.data };
}

export async function requestPickup(pickupData: any): Promise<DelhiveryResponse> {
    return await delhiveryRequest('POST', '/fm/request/pickup/json/', pickupData);
}

export async function trackShipment(waybill: string): Promise<DelhiveryResponse> {
    const result = await delhiveryRequest('GET', '/api/v1/packages/json/', { waybill });
    if (result.success && result.data.ShipmentData?.length > 0) {
        return { success: true, data: result.data.ShipmentData[0] };
    }
    return { success: false, message: "Shipment not found or tracking unavailable." };
}

export async function processOrderShipping(order: any) {
    if (!order) return { success: false, message: "No order provided" };

    const AWB_RESULT = await fetchWaybill(1);
    if (!AWB_RESULT.success || !AWB_RESULT.waybills || AWB_RESULT.waybills.length === 0) {
        return { success: false, message: "Failed to allocate AWB", details: AWB_RESULT.message };
    }

    const awb = AWB_RESULT.waybills[0];
    const originPin = process.env.DELHIVERY_ORIGIN_PINCODE || "673638";
    const shopName = process.env.DELHIVERY_WAREHOUSE_NAME || "Blactify";

    const shipmentData = {
        shipments: [
            {
                name: `${order.shipping_address?.firstName || ""} ${order.shipping_address?.lastName || ""}`.trim() || order.customer_details?.name,
                add: `${order.shipping_address?.address || ""} ${order.shipping_address?.apartment || ""}`.trim(),
                pin: order.shipping_address?.pincode,
                phone: order.customer_details?.phone || order.shipping_address?.phone,
                order: order.id,
                payment_mode: "Pre-paid",
                products_desc: order.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(", "),
                cod_amount: "0",
                order_date: new Date(order.created_at || Date.now()).toISOString(),
                total_amount: order.amount.toString(),
                seller_name: shopName,
                waybill: awb,
                quantity: order.items?.reduce((acc: number, i: any) => acc + i.quantity, 0).toString() || "1",
                weight: "500",
            }
        ],
        pickup_location: {
            name: shopName,
            add: "Blactify Warehouse, Kozhikode, Kerala",
            phone: "9188484192",
            pin: originPin
        }
    };

    const SHIPMENT_RESULT = await createShipment(shipmentData);

    if (SHIPMENT_RESULT.success) {
        const trackingUrl = `https://track.delhivery.com/tracking/track?id=${awb}`;
        const labelInfo = await generateLabel(awb);

        return { 
            success: true, 
            awb, 
            tracking_link: trackingUrl, 
            label_url: labelInfo.success ? labelInfo.packages?.[0]?.pdf_url : null,
            shipment_details: SHIPMENT_RESULT.data
        };
    }

    return { success: false, message: "Shipment registration failed in Delhivery", details: SHIPMENT_RESULT.message };
}

export async function getShippingCharges(destinationPincode: string, weightGrams: number = 500, originPincode: string = process.env.DELHIVERY_ORIGIN_PINCODE || "683543"): Promise<any> {
    if (!destinationPincode || destinationPincode.length !== 6) {
        return { success: false, message: "Invalid destination PIN code" };
    }

    const result = await delhiveryRequest('GET', '/api/kinko/v1/invoice/charges/.json', {
        md: 'E',
        ss: 'Delivered',
        d_pin: destinationPincode,
        o_pin: originPincode,
        cgm: weightGrams,
        pt: 'Pre-paid'
    });

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const chargeInfo = result.data[0];
        const totalCharge = parseFloat(chargeInfo.total_amount || chargeInfo.total_charge || 0);
        if (totalCharge > 0) return { success: true, charge: totalCharge, metadata: chargeInfo };
    }

    return { 
        success: false, 
        message: "Failed to calculate shipping charges automatically",
        fallbackCharge: destinationPincode.startsWith('6') ? 59 : 79 
    };
}

"use server";

import axios, { AxiosError } from 'axios';

const DELHI_VERY_TOKEN = process.env.DELHIVERY_TOKEN || 'xxxxxxxxxxxxxxxx';
const PRODUCTION_URL = 'https://track.delhivery.com/c/api/pin-codes/json/';
const STAGING_URL = 'https://staging-express.delhivery.com/c/api/pin-codes/json/';

export async function checkPincodeServiceability(pincode: string) {
    if (!pincode || pincode.length !== 6) {
        return { success: false, message: "Invalid PIN code format" };
    }

    console.log(`[Delhivery] Verifying pincode: ${pincode}`);

    // Try both URLs and multiple header formats because accounts vary
    const urls = [PRODUCTION_URL, STAGING_URL];
    const authFormats = [
        (t: string) => `Token ${t}`,
        (t: string) => `Bearer ${t}`,
        (t: string) => t
    ];
    
    let lastError: AxiosError | null = null;
    const tokenPreview = DELHI_VERY_TOKEN ? `${DELHI_VERY_TOKEN.substring(0, 4)}...` : "MISSING";
    console.log(`[Delhivery] Using token starting with: ${tokenPreview}`);

    for (const url of urls) {
        for (const format of authFormats) {
            const authHeader = format(DELHI_VERY_TOKEN);
            const formatLabel = authHeader.split(' ')[0] || "Plain";
            
            try {
                console.log(`[Delhivery] Trying ${url} with ${formatLabel} auth`);
                
                const response = await axios.get(`${url}?filter_codes=${pincode}`, {
                    headers: {
                        Authorization: authHeader,
                    },
                    timeout: 5000
                });

                if (response.status === 200 && response.data) {
                    const data = response.data;
                    if (data.delivery_codes && data.delivery_codes.length > 0) {
                        const info = data.delivery_codes[0].postal_code || data.delivery_codes[0];
                        
                        // Check for serviceability flags. Delhivery responses vary; some use 'is_serviceable', 
                        // others just provide 'pre_paid' and 'cod' flags.
                        const isServiceable = 
                            info.is_serviceable === "yes" || 
                            info.is_serviceable === true ||
                            info.pre_paid === "Y" || 
                            info.cod === "Y" ||
                            info.pickup === "Y";

                        if (isServiceable) {
                            console.log(`[Delhivery] SUCCESS with ${url} (${formatLabel})`);
                            return { success: true, message: "Serviceable", data: info };
                        }
                    }
                }
            } catch (err) {
                const axiosErr = err as AxiosError;
                lastError = axiosErr;
                // Only log non-401/403 errors broadly, keep logs clean
                const status = axiosErr.response?.status;
                if (status !== 401 && status !== 403) {
                    console.log(`[Delhivery] ${url} (${formatLabel}) error: ${status || axiosErr.message}`);
                }
            }
        }
    }

    // If we get here, it means all attempts failed
    const finalStatus = lastError?.response?.status;
    if (finalStatus === 401 || finalStatus === 403) {
        return { success: false, message: "API Authentication failed. Please check your Delhivery Token." };
    }

    return {
        success: false,
        message: "Delivery is not available for this location"
    };
}

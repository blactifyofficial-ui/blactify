import axios, { AxiosRequestConfig } from 'axios';
import { DelhiveryResponse } from './types';

export const DELHI_VERY_TOKEN = (process.env.DELHIVERY_TOKEN || '').trim();

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Common helper to make Delhivery API requests with multiple auth formats and retry logic.
 */
export async function delhiveryRequest(
    method: 'GET' | 'POST', 
    endpoint: string, 
    dataOrParams: Record<string, unknown> | string = {}, 
    options: { isFormData?: boolean } = {}
): Promise<DelhiveryResponse> {
    if (!DELHI_VERY_TOKEN) {
        return { success: false, message: "Shipping service is currently unavailable.", details: "Delhivery Token is missing in environment variables." };
    }

    const urls = [
        'https://track.delhivery.com',
        'https://cl-api.delhivery.com',
        'https://cp-api.delhivery.com',
        'https://express.delhivery.com',
    ];
    let bestError: { message: string, url: string, status?: number } | null = null;

    // Priority strategies for Delhivery One: Token in query string is often most reliable for labels
    const strategies = [
        { params: { 'token': DELHI_VERY_TOKEN } },
        { headers: { 'Authorization': `Token ${DELHI_VERY_TOKEN}` } },
        { headers: { 'Authorization': DELHI_VERY_TOKEN } },
        { headers: { 'Token': DELHI_VERY_TOKEN } },
        { headers: { 'Authorization': `Bearer ${DELHI_VERY_TOKEN}` } },
        { headers: { 'API-Key': DELHI_VERY_TOKEN } },
        { headers: { 'x-api-key': DELHI_VERY_TOKEN } },
    ];

    for (const baseUrl of urls) {
        for (const strategy of strategies) {
            const url = `${baseUrl}${endpoint}`;
            
            try {
                const config: AxiosRequestConfig = {
                    method,
                    url,
                    headers: {
                        ...(strategy.headers || {}),
                        'Content-Type': options.isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
                        'Accept': 'application/json',
                    },
                    params: {
                        ...(method === 'GET' ? dataOrParams as Record<string, unknown> : {}),
                        ...(strategy.params || {}),
                    },
                    timeout: 20000,
                };

                if (method !== 'GET') {
                    config.data = dataOrParams;
                    if (strategy.params?.token && options.isFormData) {
                        const tokenStr = `token=${DELHI_VERY_TOKEN}`;
                        if (typeof dataOrParams === 'string') {
                            config.data = `${dataOrParams}&${tokenStr}`;
                        }
                    }
                }

                const response = await axios(config);
                const respData = response.data;

                // Detect HTML (redirects/tracking pages)
                const isHtml = typeof respData === 'string' && (
                    respData.trim().startsWith("<!DOCTYPE") || 
                    respData.trim().startsWith("<html") || 
                    respData.includes("<html>")
                );
                
                if (isHtml) {
                    if (!bestError) bestError = { message: "HTML response received (possible redirect)", url };
                    continue;
                }

                const isErrorObject = typeof respData === 'object' && respData !== null && (
                    (respData as Record<string, unknown>).status === "Error" || 
                    (respData as Record<string, unknown>).success === false ||
                    (respData as Record<string, unknown>).status === "failed"
                );

                if (isErrorObject) {
                    const data = respData as Record<string, unknown>;
                    const msg = String(data.message || data.remarks || JSON.stringify(respData));
                    if (msg.includes("Insufficient") || msg.includes("Balance")) {
                        return { success: false, message: "Delhivery Wallet Balance is insufficient.", details: msg };
                    }
                    if (!bestError || bestError.message.includes("HTML")) {
                        bestError = { message: msg, url };
                    }
                    continue;
                }

                const contentType = response.headers['content-type'] || '';
                console.log(`[Delhivery Success] Connected via ${baseUrl} (Content-Type: ${contentType})`);
                
                if (process.env.NODE_ENV === 'development') {
                    if (contentType.includes('application/json')) {
                        console.log(`[Delhivery Debug] Raw JSON Response:`, JSON.stringify(respData).substring(0, 500));
                    } else {
                        console.log(`[Delhivery Debug] Received non-JSON response of type: ${contentType}`);
                    }
                }

                // If it's a binary PDF, we might need a special return format
                if (contentType.includes('application/pdf')) {
                    return { success: true, data: respData, message: "BINARY_PDF" };
                }

                return { success: true, data: respData };

            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    const status = err.response?.status;
                    const errorBody = err.response?.data;
                    const msg = typeof errorBody === 'string' ? errorBody : (errorBody?.message || err.message);
                    
                    if (!bestError || (status !== undefined && bestError.status === undefined)) {
                        bestError = { message: msg, url, status };
                    } else if (status === 401 || status === 403) {
                        bestError = { message: msg, url, status };
                    }
                }
            }
        }
    }

    return { 
        success: false, 
        message: bestError?.message.toLowerCase().includes("balance") ? "Insufficient wallet balance." : "Shipping service returned an error.", 
        details: bestError ? `[Last URL: ${bestError.url}] ${bestError.message}` : "Connection failed to all endpoints." 
    };
}

/**
 * Specialized version of delhiveryRequest for status polling.
 */
export async function delhiveryPollingRequest(method: string, endpoint: string, data: Record<string, unknown> = {}): Promise<DelhiveryResponse> {
    const baseUrl = 'https://track.delhivery.com';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    const strategies = [
        { headers: { 'Authorization': `Token ${DELHI_VERY_TOKEN}` } },
        { params: { 'token': DELHI_VERY_TOKEN } }
    ];

    let lastError: unknown = null;

    for (const strategy of strategies) {
        try {
            const resp = await axios({
                method,
                url,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...strategy.headers
                },
                params: {
                    ...strategy.params,
                    ...(method === 'GET' ? data : {})
                },
                data: method !== 'GET' ? data : undefined,
                timeout: 10000 
            });

            return { success: true, data: resp.data };
        } catch (err: unknown) {
            lastError = err;
        }
    }

    if (axios.isAxiosError(lastError)) {
        const status = lastError.response?.status;
        const errorBody = lastError.response?.data;
        const msg = typeof errorBody === 'string' ? errorBody : (errorBody?.message || lastError.message);
        return { 
            success: false, 
            message: msg,
            details: `${status ? status + ' ' : ''}${msg} [URL: ${url}]`.substring(0, 200)
        };
    }

    return { 
        success: false, 
        message: "Connection failed.", 
        details: String(lastError) 
    };
}

"use server";

import { headers } from "next/headers";

/**
 * GET CLIENT IP
 * Used in MaintenanceGuard.tsx to check against whitelist
 */
export async function getClientIP() {
    const headerList = await headers();
    
    // Standard headers for getting real IP behind proxies (Vercel, Railway, etc.)
    const forwardedFor = headerList.get("x-forwarded-for");
    const realIP = headerList.get("x-real-ip");
    
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    
    if (realIP) {
        return realIP;
    }
    
    return "127.0.0.1"; // Fallback for local dev
}

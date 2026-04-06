"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getMaintenanceStatus } from "@/app/actions/settings";
import { getClientIP } from "@/actions/get-client-ip";
import { MAINTENANCE_CONFIG } from "@/lib/maintenance-config";
import MaintenancePage from "@/components/maintenance/MaintenancePage";
import { cn } from "@/lib/utils";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState("");
    const [maintenanceEndTime, setMaintenanceEndTime] = useState<string | null>(null);
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [checked, setChecked] = useState(false);

    // Admin, Developer, post-payment routes, and local development always bypass maintenance
    const isLocalhost = typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || 
         window.location.hostname === "127.0.0.1" || 
         window.location.hostname === "[::1]");

    const isBypassRoute =
        (isLocalhost && !searchParams?.get("preview_maintenance")) ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/developer") ||
        pathname?.startsWith("/checkout/success") ||
        pathname?.startsWith("/checkout/failure");

    useEffect(() => {
        if (isBypassRoute) {
            setChecked(true);
            return;
        }


        let mounted = true;
        const check = async () => {
            try {
                // Parallel check status and client IP
                const [status, clientIp] = await Promise.all([
                    getMaintenanceStatus(),
                    getClientIP()
                ]);
                
                if (mounted) {
                    setIsMaintenanceMode(status.maintenance_mode);
                    setMaintenanceMessage(status.maintenance_message || "");
                    setMaintenanceEndTime(status.maintenance_end_time || null);
                    
                    // Check if current IP is in bypass list
                    const whitelist = status.bypass_ips || [];
                    const ipMatch = whitelist.includes(clientIp);
                    setIsWhitelisted(ipMatch);
                    
                    setChecked(true);
                }
            } catch {
                if (mounted) setChecked(true);
            }
        };

        check();
        const interval = setInterval(check, 30000);
        return () => { mounted = false; clearInterval(interval); };
    }, [pathname, isBypassRoute]);

    // Added local state to handle the reveal when timer ends
    const [timerEnded, setTimerEnded] = useState(false);

    if (!checked) return null;
    
    // Check if maintenance belongs to bypass route or is whitelisted
    const shouldBypass = isBypassRoute || isWhitelisted;

    // Check if maintenance is active (either from DB or Local Config)
    let isActive = (isMaintenanceMode || MAINTENANCE_CONFIG.isActive) && !timerEnded;

    // Check if dynamic timer from database has already ended
    if (maintenanceEndTime && new Date(maintenanceEndTime) <= new Date()) {
        isActive = false;
    }

    if (shouldBypass) return <>{children}</>;

    return (
        <>
            <div className={cn(isActive && "pointer-events-none")}>
                {children}
            </div>
            {isActive && (
                <MaintenancePage 
                    onFinish={() => setTimerEnded(true)} 
                    endTime={maintenanceEndTime}
                    message={maintenanceMessage || MAINTENANCE_CONFIG.message}
                />
            )}
        </>
    );
}

// MaintenanceScreen removed in favor of premium MaintenancePage component

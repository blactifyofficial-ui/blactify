"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getMaintenanceStatus } from "@/app/actions/settings";
import { getClientIP } from "@/actions/get-client-ip";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState("");
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [checked, setChecked] = useState(false);

    // Admin, Developer, post-payment routes, and local development always bypass maintenance
    const isLocalhost = typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || 
         window.location.hostname === "127.0.0.1" || 
         window.location.hostname === "[::1]");

    const isBypassRoute =
        isLocalhost ||
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

    if (!checked) return null;
    if (isBypassRoute || isWhitelisted || !isMaintenanceMode) return <>{children}</>;

    return <MaintenanceScreen message={maintenanceMessage} />;
}

function MaintenanceScreen({ message }: { message: string }) {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".");
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Animated floating shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-zinc-100 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: "4s" }} />
                <div className="absolute bottom-[20%] right-[15%] w-48 h-48 bg-zinc-50 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
                <div className="absolute top-[60%] left-[60%] w-32 h-32 bg-zinc-100/50 rounded-full blur-[40px] animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
            </div>

            <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
                {/* Brand Logo */}
                <div className="relative mb-10">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-black/5 transition-transform duration-700 hover:scale-105 overflow-hidden">
                        <img 
                            src="/welcome-eye.png" 
                            alt="Blactify Logo" 
                            className="w-14 h-14 object-contain"
                        />
                    </div>
                    {/* Ping indicator */}
                    <div className="absolute -top-1 -right-1 w-4 h-4">
                        <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-75" />
                        <div className="absolute inset-0 bg-amber-400 rounded-full" />
                    </div>
                </div>

                {/* Brand */}
                <h1
                    className="text-4xl md:text-5xl font-black text-black tracking-tighter mb-2"
                    style={{ textTransform: "uppercase", letterSpacing: "-0.04em" }}
                >
                    BLACTIFY
                </h1>

                <div className="flex items-center gap-3 mb-8">
                    <div className="h-px w-8 bg-zinc-200" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                        Under Maintenance
                    </span>
                    <div className="h-px w-8 bg-zinc-200" />
                </div>

                {/* Message */}
                <p className="text-zinc-500 text-sm md:text-base leading-relaxed mb-6 max-w-sm">
                    {message || "We're performing scheduled maintenance. We'll be back shortly."}
                </p>

                {/* Instagram Link */}
                <a
                    href="https://instagram.com/blactify"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mb-10 px-6 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] transition-all hover:bg-zinc-100 hover:scale-105 active:scale-95"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    Instagram @blactify
                </a>

                {/* Status indicator */}
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-50 border border-zinc-100 rounded-full">
                    <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                        <div className="absolute w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em]">
                        Working on it{dots}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-[0.3em]">
                    &copy; {new Date().getFullYear()} Blactify. All rights reserved.
                </p>
            </div>
        </div>
    );
}

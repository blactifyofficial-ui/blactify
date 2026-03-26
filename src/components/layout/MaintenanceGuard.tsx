"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getMaintenanceStatus } from "@/app/actions/settings";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState("");
    const [checked, setChecked] = useState(false);

    // Admin, Developer, and post-payment routes always bypass maintenance
    // /checkout/success and /checkout/failure MUST bypass: if a user already paid
    // but maintenance was toggled mid-payment, they must still see their confirmation.
    const isBypassRoute =
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/developer") ||
        pathname?.startsWith("/checkout/success") ||
        pathname?.startsWith("/checkout/failure");

    useEffect(() => {
        if (isBypassRoute) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setChecked(true);
            return;
        }

        let mounted = true;
        const check = async () => {
            try {
                const status = await getMaintenanceStatus();
                if (mounted) {
                    setIsMaintenanceMode(status.maintenance_mode);
                    setMaintenanceMessage(status.maintenance_message || "");
                    setChecked(true);
                }
            } catch {
                if (mounted) setChecked(true);
            }
        };

        check();
        // Poll every 30s in case maintenance mode changes
        const interval = setInterval(check, 30000);
        return () => { mounted = false; clearInterval(interval); };
    }, [pathname, isBypassRoute]);

    if (!checked) return null;
    if (isBypassRoute || !isMaintenanceMode) return <>{children}</>;

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
                {/* Animated wrench icon */}
                <div className="relative mb-10">
                    <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 rotate-3 hover:rotate-0 transition-transform duration-700">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[spin_8s_linear_infinite]">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
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
                <p className="text-zinc-500 text-sm md:text-base leading-relaxed mb-10 max-w-sm">
                    {message || "We're performing scheduled maintenance. We'll be back shortly."}
                </p>

                {/* Status indicator */}
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-50 border border-zinc-100 rounded-full mb-8">
                    <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                        <div className="absolute w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em]">
                        Working on it{dots}
                    </span>
                </div>

                {/* Social/Contact */}
                <div className="flex items-center gap-6 text-zinc-300">
                    <a
                        href="https://instagram.com/blactify"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-black transition-colors duration-300"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                    </a>
                    <a
                        href="mailto:support@blactify.com"
                        className="hover:text-black transition-colors duration-300"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </a>
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

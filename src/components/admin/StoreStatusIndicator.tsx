"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";

export function StoreStatusIndicator() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<{ maintenance_mode: boolean; purchases_enabled: boolean } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const idToken = await user.getIdToken();
                const response = await fetch("/api/admin/store-settings", {
                    headers: { "Authorization": `Bearer ${idToken}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                }
            } catch (err) {
                console.error("Failed to fetch store settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
        // Keep it dynamic
        const interval = setInterval(fetchSettings, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const isOnline = !!settings && !settings.maintenance_mode && settings.purchases_enabled;

    if (loading) return (
        <div className="h-10 w-32 bg-zinc-50 border border-zinc-100 animate-pulse rounded-full" />
    );

    return (
        <div
            className={cn(
                "group relative px-6 py-2.5 rounded-full flex items-center gap-3 transition-all duration-500 border shadow-sm",
                isOnline 
                    ? "bg-black text-white border-transparent" 
                    : "bg-white text-red-600 border-red-100 shadow-[0_10px_30px_rgba(220,38,38,0.05)]"
            )}
        >
            <div className="relative flex items-center justify-center">
                <div className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-500",
                    isOnline ? "bg-emerald-500" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                )} />
                {isOnline && (
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                )}
            </div>

            <span className="text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
                {isOnline ? "Store Online" : "Store Offline"}
            </span>
        </div>
    );
}

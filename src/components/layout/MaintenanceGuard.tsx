"use client";

import React, { useEffect, useState } from 'react';
import { getMaintenanceStatus } from '@/app/actions/settings';
import { usePathname } from 'next/navigation';
import { Loader2, Wrench, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const [maintenance, setMaintenance] = useState<{
        enabled: boolean;
        message: string;
        bypass_ips: string[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBypassed, setIsBypassed] = useState(false);
    const pathname = usePathname();

    // 1. Define internal/admin paths that should always be accessible to staff
    const adminRoutes = [
        '/admin',
        '/developer',
        '/checkout', // Allow checkout for testing unless explicitly broken
        '/api/auth',
        '/api/user/sync-profile'
    ];

    const isInternalRoute = adminRoutes.some(route => pathname?.startsWith(route));

    useEffect(() => {
        async function checkStatus() {
            setLoading(true);
            try {
                // Allow admin/developer routes to bypass maintenance check locally for developers
                if (isInternalRoute) {
                    setIsBypassed(true);
                    setLoading(false);
                    return;
                }

                const status = await getMaintenanceStatus();
                setMaintenance({
                    enabled: status.maintenance_mode,
                    message: status.maintenance_message,
                    bypass_ips: status.bypass_ips,
                });

                // Check for IP bypass
                try {
                    const res = await fetch('https://api.ipify.org?format=json');
                    const data = await res.json();
                    if (status.bypass_ips.includes(data.ip)) {
                        setIsBypassed(true);
                    }
                } catch {
                    // IP check failed, proceed with normal maintenance logic
                }
            } catch (error) {
                console.error('Failed to fetch maintenance status:', error);
            } finally {
                setLoading(false);
            }
        }

        checkStatus();
    }, [pathname, isInternalRoute]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-6 text-center">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-zinc-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Initializing Environment</p>
            </div>
        );
    }

    // If maintenance is enabled and path is not bypassed, show maintenance page
    if (maintenance?.enabled && !isBypassed && !isInternalRoute) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-8 md:p-12 text-center relative overflow-hidden">
                {/* Visual accents */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-transparent to-red-500 opacity-20" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-transparent to-red-500 opacity-20" />
                
                <div className="relative group mb-12">
                    <div className="absolute -inset-4 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-700" />
                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center relative rotate-3 group-hover:rotate-0 transition-all duration-500">
                        <Wrench size={40} className="text-white opacity-80" />
                    </div>
                </div>

                <div className="max-w-xl space-y-8 relative">
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                             <span className="h-[1px] w-8 bg-zinc-800" />
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/80">System Alert</span>
                             <span className="h-[1px] w-8 bg-zinc-800" />
                        </div>
                        <h1 className="font-yapari text-4xl md:text-6xl tracking-tighter uppercase leading-[0.9] text-white">
                            Scheduled <br /> 
                            <span className="opacity-40">Maintenance</span>
                        </h1>
                        <p className="text-zinc-500 font-medium text-sm md:text-base leading-relaxed tracking-tight max-w-md mx-auto">
                            {maintenance.message}
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                                <ShieldAlert size={20} className="text-red-500" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Project Status</p>
                                <p className="text-xs font-bold text-white uppercase tracking-tight">Active Development Cycle • Phase 4</p>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-white/5" />
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] leading-relaxed">
                            Our team is currently performing critical infrastructure updates. We apologize for the temporary disruption.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <a 
                            href="https://instagram.com/blactify" 
                            target="_blank" 
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors"
                        >
                            Follow Updates
                        </a>
                        <span className="hidden sm:block h-1 w-1 rounded-full bg-zinc-800" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Live Monitoring Active</span>
                        </div>
                    </div>
                </div>

                {/* Background noise/grain */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
            </div>
        );
    }

    return (
        <div className={cn(
            "transition-opacity duration-700",
            loading ? "opacity-0" : "opacity-100"
        )}>
            {children}
        </div>
    );
}

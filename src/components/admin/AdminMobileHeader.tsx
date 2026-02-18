"use client";

import { Menu, Eye } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { cn } from "@/lib/utils";

export function AdminMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const hasNewOrder = useNotificationStore((state) => state.hasNewOrder);

    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 w-full h-14 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg active:scale-95 transition-all shadow-sm"
                >
                    <Menu size={18} strokeWidth={2.5} />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-sm font-black tracking-tight text-black leading-none uppercase">Blactify</h2>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">Admin</p>
                </div>
            </div>

            <div className="relative">
                <div className={cn(
                    "w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-500",
                    hasNewOrder
                        ? "bg-black border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-eye-glow"
                        : "bg-black border-zinc-200"
                )}>
                    <Eye
                        size={18}
                        strokeWidth={2.5}
                        className={cn(
                            "transition-colors duration-500",
                            hasNewOrder ? "text-red-500" : "text-white/40"
                        )}
                    />
                </div>
                {hasNewOrder && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                )}
            </div>
        </header>
    );
}

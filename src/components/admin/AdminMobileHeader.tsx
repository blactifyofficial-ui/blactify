"use client";

import { Menu } from "lucide-react";
import { AdminNotificationDropdown } from "./AdminNotificationDropdown";

export function AdminMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 w-full h-14 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="w-11 h-11 flex items-center justify-center bg-black text-white rounded-xl active:scale-95 transition-all shadow-sm"
                >
                    <Menu size={20} strokeWidth={2} />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-sm font-black tracking-tight text-black leading-none uppercase">Blactify</h2>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">Admin</p>
                </div>
            </div>

            <AdminNotificationDropdown />
        </header>
    );
}

"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
}

export function LogoutModal({
    isOpen,
    onClose,
    onConfirm,
    loading = false
}: LogoutModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[150] bg-black/40 transition-opacity backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            <div
                className={cn(
                    "fixed left-1/2 top-1/2 z-[160] w-full max-w-[320px] sm:max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white p-8 shadow-2xl rounded-[32px] transition-all duration-300 scale-100 opacity-100",
                    !isOpen && "scale-95 opacity-0 pointer-events-none"
                )}
            >
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-900 border border-zinc-100 shadow-sm">
                        <LogOut size={28} strokeWidth={2.5} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Sign Out</h3>
                        <p className="text-sm text-zinc-500 font-medium">Are you sure you want to log out of the admin panel?</p>
                    </div>

                    <div className="flex flex-col gap-3 w-full pt-2">
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="w-full px-6 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? "Signing out..." : "Yes, Sign Out"}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-full px-6 py-4 bg-white border border-zinc-100 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all disabled:opacity-50"
                        >
                            Stay Logged In
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

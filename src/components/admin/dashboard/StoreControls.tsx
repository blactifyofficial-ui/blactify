"use client";

import { Store, Unlock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreControlsProps {
    purchasesEnabled: boolean;
    onTogglePurchases: () => void;
    isUpdatingPurchases: boolean;
}

export function StoreControls({
    purchasesEnabled,
    onTogglePurchases,
    isUpdatingPurchases,
}: StoreControlsProps) {
    return (
        <>
            {/* Store Status Control */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 h-[200px] flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Store className="text-[#000000]" size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">System Infrastructure</span>
                        </div>
                        <h4 className="text-2xl font-black text-[#000000] tracking-tighter leading-none pt-1">Store Purchases</h4>
                    </div>
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        purchasesEnabled ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                        {purchasesEnabled ? <Unlock size={18} /> : <Lock size={18} />}
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <p className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-[0.1em] pr-4 leading-relaxed">
                        {purchasesEnabled ? "Active & Live" : "Paused for Maintenance"}
                    </p>
                    <button
                        onClick={onTogglePurchases}
                        disabled={isUpdatingPurchases}
                        className={cn(
                            "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                            purchasesEnabled
                                ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-100",
                            isUpdatingPurchases && "opacity-50 cursor-wait"
                        )}
                    >
                        {purchasesEnabled ? "Disable" : "Enable"}
                    </button>
                </div>
            </div>
        </>
    );
}

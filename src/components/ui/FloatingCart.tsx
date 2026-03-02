"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function FloatingCart({ onClick }: { onClick: () => void }) {
    const { getTotalItems } = useCartStore();
    const cartItemCount = getTotalItems();
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && cartItemCount > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [cartItemCount, mounted]);

    return (
        <button
            onClick={onClick}
            className={cn(
                "fixed top-20 right-6 z-[60] w-14 h-14 rounded-full transition-all duration-500 transform active:scale-95 flex items-center justify-center",
                "bg-white/80 backdrop-blur-xl border border-zinc-200/50 shadow-[0_12px_40px_rgba(0,0,0,0.15)]",
                "text-black hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
                isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-[-20px] opacity-0 scale-50 pointer-events-none"
            )}
            aria-label="Open Cart"
        >
            <div className="relative flex items-center justify-center">
                <ShoppingBag size={28} strokeWidth={2} />
                {mounted && cartItemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white border-2 border-white shadow-sm animate-in zoom-in duration-300">
                        {cartItemCount}
                    </span>
                )}
            </div>
        </button>
    );
}

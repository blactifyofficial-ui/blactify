"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/store/AuthContext";
import { useCartStore } from "@/store/useCartStore";
import { getWelcomeDiscountStatus } from "@/lib/profile-sync";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WelcomeBanner() {
    const { user } = useAuth();
    const { applyDiscount, discountCode } = useCartStore();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        async function checkEligibility() {
            if (user && !isDismissed) {
                const used = await getWelcomeDiscountStatus(user.uid);
                if (!used && discountCode !== "WELCOME10") {
                    setIsVisible(true);
                }
            }
        }
        checkEligibility();
    }, [user, isDismissed, discountCode]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-[360px] animate-in slide-in-from-right duration-500">
            <div className="bg-black text-white p-6 rounded-[32px] shadow-2xl relative overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-700" />

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-xl text-yellow-400">
                        <Sparkles size={18} fill="currentColor" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Special Offer</span>
                </div>

                <h3 className="font-empire text-2xl uppercase leading-tight mb-2">
                    Welcome to <br />
                    <span className="text-zinc-400">Blactify</span>
                </h3>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-6 pr-4">
                    Enjoy <span className="text-white font-bold">10% OFF</span> on your very first order. Our gift to you for joining the collective.
                </p>

                <button
                    onClick={() => {
                        applyDiscount("WELCOME10");
                        setIsVisible(false);
                        setIsDismissed(true);
                    }}
                    className="w-full h-14 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-100 transition-all active:scale-95 group/btn"
                >
                    Apply Discount
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

export default function WelcomeBanner() {
    const [isOpen, setIsOpen] = useState(false);
    const { applyDiscount } = useCartStore();

    useEffect(() => {
        const checkAndShow = () => {
            const dismissed = localStorage.getItem("welcome-offer-dismissed");
            // Only show if not already dismissed and user has scrolled down
            if (!dismissed && window.scrollY > 300) {
                setIsOpen(true);
                return true;
            }
            return false;
        };

        const handleScroll = () => {
            if (checkAndShow()) {
                window.removeEventListener("scroll", handleScroll);
            }
        };

        // If animation has already played in this session, start listening immediately.
        // Otherwise, wait for the animation to finish (approx 8s).
        const animationShown = sessionStorage.getItem("welcome-animation-shown");
        const initialDelay = animationShown ? 100 : 8000;

        const timer = setTimeout(() => {
            window.addEventListener("scroll", handleScroll);

            // Check immediately in case they already scrolled
            if (checkAndShow()) {
                window.removeEventListener("scroll", handleScroll);
            }

            // Fallback: show after additional 15s if still not shown
            const fallbackTimer = setTimeout(() => {
                const dismissed = localStorage.getItem("welcome-offer-dismissed");
                if (!dismissed) {
                    setIsOpen(true);
                }
            }, 15000);

            return () => clearTimeout(fallbackTimer);
        }, initialDelay);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            clearTimeout(timer);
        };
    }, []);

    const dismiss = () => {
        setIsOpen(false);
        localStorage.setItem("welcome-offer-dismissed", "true");
    };

    const handleClaim = () => {
        applyDiscount("WELCOME10");
        dismiss();
    };

    return (
        <div
            className={cn(
                "fixed inset-x-0 bottom-0 z-[100] transition-transform duration-500 ease-in-out",
                isOpen ? "translate-y-0" : "translate-y-full"
            )}
        >
            <div className="w-full md:max-w-md mx-auto rounded-t-[40px] bg-black/60 backdrop-blur-2xl border-t border-white/10 p-8 pt-16 pb-12 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative">
                <button
                    aria-label="Close"
                    onClick={dismiss}
                    className="absolute top-6 right-6 p-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                    <X size={24} />
                </button>
                <div className="text-center flex flex-col gap-8">
                    <div>
                        <h2 className="font-empire text-7xl md:text-8xl mb-4 tracking-tighter leading-none font-black">Welcome Offer</h2>
                        <p className="text-zinc-200 text-base leading-relaxed">
                            Get 10% off your first order.<br />Use code: <span className="font-bold text-white">WELCOME10</span>
                        </p>
                    </div>

                    <button
                        onClick={handleClaim}
                        className="w-full rounded-full bg-white py-5 text-sm font-bold uppercase tracking-widest text-black active:scale-[0.98] hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                        Claim Discount
                    </button>
                </div>
            </div>
        </div>
    );
}

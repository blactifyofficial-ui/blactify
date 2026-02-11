"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function WelcomeOffer() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            const dismissed = localStorage.getItem("welcome-offer-dismissed");
            if (!dismissed) {
                setIsOpen(true);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        setIsOpen(false);
        localStorage.setItem("welcome-offer-dismissed", "true");
    };

    return (
        <div
            className={cn(
                "fixed inset-x-0 bottom-0 z-[60] p-4 transition-transform duration-500 ease-in-out",
                isOpen ? "translate-y-0" : "translate-y-full"
            )}
        >
            <div className="mx-auto max-w-md rounded-t-3xl bg-black p-8 text-white shadow-2xl">
                <div className="flex justify-end">
                    <button onClick={dismiss} className="p-2 opacity-60 hover:opacity-100">
                        <X size={20} />
                    </button>
                </div>
                <div className="text-center">
                    <h2 className="font-empire text-3xl mb-2">Welcome Offer</h2>
                    <p className="mb-8 text-zinc-400">
                        Get 10% off your first order. Use code: <span className="font-bold text-white">WELCOME10</span>
                    </p>
                    <button
                        onClick={dismiss}
                        className="w-full rounded-full bg-white py-4 text-sm font-bold uppercase tracking-widest text-black active:scale-[0.98]"
                    >
                        Claim Discount
                    </button>
                </div>
            </div>
        </div>
    );
}

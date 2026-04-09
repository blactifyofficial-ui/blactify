"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-8 left-6 z-[60] w-12 h-12 rounded-md transition-all duration-500 transform flex items-center justify-center",
                "bg-white/80 backdrop-blur-xl border border-zinc-200/50 shadow-[0_12px_40px_rgba(0,0,0,0.1)]",
                "text-black hover:bg-white hover:scale-105 active:scale-95",
                isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-50 pointer-events-none"
            )}
            aria-label="Scroll to top"
        >
            <ArrowUp size={20} strokeWidth={1.5} />
        </button>
    );
}

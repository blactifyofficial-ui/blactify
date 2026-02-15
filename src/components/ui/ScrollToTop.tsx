"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
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
                "fixed bottom-24 right-6 z-50 p-3 rounded-full transition-all duration-300 transform active:scale-95",
                "bg-zinc-400/20 backdrop-blur-md border border-white/20 shadow-lg",
                "text-zinc-600 hover:text-black hover:bg-zinc-400/30",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
            )}
            aria-label="Scroll to top"
        >
            <ArrowUp size={20} />
        </button>
    );
}

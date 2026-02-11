"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TopNavbar() {
    const [showFullText, setShowFullText] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Handle scroll visibility
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle text looping (3s delay)
    useEffect(() => {
        const interval = setInterval(() => {
            setShowFullText((prev) => !prev);
        }, 3000); // 3 seconds delay

        return () => clearInterval(interval);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out px-6 md:px-12 bg-white/70 backdrop-blur-md text-black border-b border-zinc-200/50 h-14",
                isVisible
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-full opacity-0 pointer-events-none"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-center h-full">
                <Link href="/" className="relative flex items-center justify-center group h-8 overflow-hidden">
                    {/* Ghost text to maintain width for centering since spans are absolute */}
                    <span className="text-xl font-bold tracking-tighter invisible pointer-events-none whitespace-nowrap px-4">
                        Blactify Essentials
                    </span>
                    <span
                        className={cn(
                            "text-xl font-bold tracking-tighter transition-all duration-500 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                            showFullText ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
                        )}
                    >
                        blactify
                    </span>
                    <span
                        className={cn(
                            "text-xl font-bold tracking-tighter transition-all duration-500 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                            showFullText ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                        )}
                    >
                        Blactify Essentials
                    </span>
                </Link>
            </div>
        </header>
    );
}

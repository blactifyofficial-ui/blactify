"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const [showFullText, setShowFullText] = useState(false);

    // Text looping (3s delay)
    useEffect(() => {
        const interval = setInterval(() => {
            setShowFullText((prev) => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <header
            className="fixed top-0 left-0 right-0 z-[70] transition-all duration-500 ease-in-out px-4 md:px-12 bg-white/40 backdrop-blur-md text-black border-b border-zinc-200/50 h-12"
        >
            <div className="max-w-7xl mx-auto flex items-center h-full relative">
                {/* Left: Hamburger Menu */}
                <button
                    onClick={onMenuClick}
                    className="absolute left-0 p-2 hover:bg-zinc-100 rounded-full transition-colors z-10"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>

                {/* Center: Logo */}
                <div className="flex-1 flex justify-center">
                    <Link href="/" className="relative flex items-center justify-center group h-10 overflow-hidden">
                        <span className="text-xl md:text-2xl font-empire invisible pointer-events-none whitespace-nowrap px-4">
                            Blactify Essentials
                        </span>
                        <span
                            className={cn(
                                "text-xl md:text-2xl font-empire transition-all duration-500 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                                showFullText ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
                            )}
                        >
                            blactify
                        </span>
                        <span
                            className={cn(
                                "text-xl md:text-2xl font-empire transition-all duration-500 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                                showFullText ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                            )}
                        >
                            Blactify Essentials
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
}


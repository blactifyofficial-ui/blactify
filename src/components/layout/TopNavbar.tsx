"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNavbar() {
    const [isVisible, setIsVisible] = useState(false);
    const [showFullText, setShowFullText] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isProductPage = pathname.startsWith("/product/");

    // Handle scroll visibility
    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setIsVisible(y > 50);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle text looping (4s delay)
    useEffect(() => {
        const interval = setInterval(() => {
            setShowFullText((prev) => !prev);
        }, 2000); // 4 seconds delay as requested (between 3-5s)

        return () => clearInterval(interval);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out px-6 md:px-12 h-14",
                "bg-white/70 backdrop-blur-md border-b border-white/20 text-black", // Glass effect
                isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between h-full relative">
                {/* Left Action: Back Button (Mobile Product Page) */}
                <div className="flex items-center w-12">
                    {isProductPage && (
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                </div>

                {/* Looping Brand Text */}
                <Link href="/" className="relative flex items-center justify-center group h-8 flex-1 overflow-hidden">
                    {/* Ghost text to maintain width for centering since spans are absolute */}
                    <span className="text-xl font-bold tracking-tighter invisible pointer-events-none whitespace-nowrap px-4">
                        Blactify Essentials
                    </span>
                    <span
                        className={cn(
                            "text-xl font-bold tracking-tighter transition-all duration-700 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                            showFullText ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
                        )}
                    >
                        blactify
                    </span>
                    <span
                        className={cn(
                            "text-xl font-bold tracking-tighter transition-all duration-700 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                            showFullText ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                        )}
                    >
                        Blactify Essentials
                    </span>
                </Link>

                {/* Right Spacer (to keep logo centered) */}
                <div className="w-12" />
            </div>
        </header>
    );
}

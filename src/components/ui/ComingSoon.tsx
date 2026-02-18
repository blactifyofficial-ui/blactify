"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import logoIcon from "@/app/logo-v1.png";

export function ComingSoon() {
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen bg-[#F5F5F5] flex items-center justify-center font-heading p-6 selection:bg-black selection:text-white">
            {/* Minimal Content Container */}
            <div className={cn(
                "w-full max-w-4xl aspect-[4/3] rounded-[60px] md:rounded-[120px] flex flex-col items-center justify-center text-center p-6 md:p-20 shadow-sm transition-all duration-1000 ease-in-out animate-zoom-in",
                isVisible ? "bg-[#EBEBEB]" : "bg-[#EBEBEB]/40 backdrop-blur-sm"
            )}>

                {/* Logo */}
                <div className={cn(
                    "relative z-10 mb-2 md:mb-6 transition-all duration-1000 ease-in-out",
                    isVisible ? "opacity-100 animate-eye-glow-dark" : "opacity-30"
                )}>
                    <Image
                        src={logoIcon}
                        alt="Blactify"
                        width={200}
                        height={200}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Main Heading */}
                <div className="flex flex-col gap-2 md:gap-4 mb-2 md:mb-8 text-center">
                    <h1 className={cn(
                        "text-5xl md:text-[110px] leading-[0.95] tracking-normal uppercase font-black transition-all duration-1000 ease-in-out",
                        isVisible ? "text-[#333639]/90 scale-100" : "text-[#333639]/10 scale-95"
                    )}>
                        COMING<br />SOON
                    </h1>
                </div>

                {/* Subtitle */}
                <div className="mt-4 md:mt-8">
                    <p className={cn(
                        "text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-black transition-opacity duration-1000 ease-in-out",
                        isVisible ? "text-[#333639]/60" : "text-[#333639]/10"
                    )}>
                        BLACTIFY | COMING SOON
                    </p>
                </div>
            </div>
        </div>
    );
}

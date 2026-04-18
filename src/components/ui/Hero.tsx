"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";


interface HeroProps {
    images: string[];
}

export function Hero({ images }: HeroProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isClicked, setIsClicked] = useState(false);
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        // Only trigger special animation on mobile/touch
        if (window.innerWidth < 768) {
            e.preventDefault();
            setIsClicked(true);

            // Allow animation to play before navigating
            setTimeout(() => {
                router.push("/shop");
            }, 600);
        }
    };

    // Image crossfade cycle
    useEffect(() => {
        if (images.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        
        return () => clearInterval(interval);
    }, [images.length]);





    return (
        <section
            className="relative h-[55vh] md:h-[85vh] w-full bg-black z-10 overflow-hidden"
        >
            {/* Background Images Wrapper (Clips the images) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                {images.map((img, i) => {
                    // Only render current, next, and previous for smooth transitions
                    const isVisible = i === currentImageIndex;
                    const isNext = i === (currentImageIndex + 1) % images.length;
                    const isPrev = i === (currentImageIndex - 1 + images.length) % images.length;
                    
                    if (!isVisible && !isNext && !isPrev && images.length > 2) return null;

                    return (
                        <div
                            key={`${img}-${i}`}
                            className={cn(
                                "hero-bg-image absolute inset-0 w-full h-full accelerate transition-all duration-[2000ms] ease-in-out",
                                i === currentImageIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`Hero Collection Image ${i + 1}`}
                                fill
                                sizes="100vw"
                                className="object-contain"
                                priority={i === 0}
                                loading={i === 0 ? "eager" : "lazy"}
                            />
                        </div>
                    );
                })}

                {/* Grain / Noise (Must stay inside current clip) */}
                <div className="absolute inset-0 noise-bg pointer-events-none z-[1]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
                {/* CTA ONLY */}
                <div>
                    <Link
                        href="/shop"
                        onClick={handleClick}
                        className={cn(
                            "group relative inline-flex items-center gap-2 px-4 py-1.5 md:gap-2.5 md:px-6 md:py-2.5 bg-zinc-900/60 backdrop-blur-xl text-white text-[7px] md:text-[9px] font-bold uppercase tracking-[0.3em] rounded-full border border-white/10 overflow-hidden transition-all duration-500 hover:bg-white/10 hover:tracking-[0.4em] active:scale-95 shadow-2xl shadow-black/40",
                            isClicked && "bg-white/20 tracking-[0.4em]"
                        )}
                    >
                        {/* Logo Animation */}
                        <div className={cn(
                            "relative flex items-center max-w-0 opacity-0 -translate-x-3 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:max-w-[60px] group-hover:opacity-100 group-hover:translate-x-0",
                            isClicked && "max-w-[60px] opacity-100 translate-x-0"
                        )}>
                            <span className={cn(
                                "text-[10px] md:text-[11px] font-yapari text-white tracking-tighter uppercase transition-transform duration-500 group-hover:scale-110",
                                isClicked && "scale-110"
                            )}>
                                STUDIO
                            </span>
                        </div>

                        <span className="relative z-10 flex items-center gap-1">
                            Shop Now
                        </span>

                        {/* Glassy Sweep Animation */}
                        <div className={cn(
                            "absolute inset-0 bg-white/10 translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-y-0",
                            isClicked && "translate-y-0"
                        )} />
                    </Link>
                </div>
            </div>

            {/* Ambient lights */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/[0.05] blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/[0.05] blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </section>
    );
}

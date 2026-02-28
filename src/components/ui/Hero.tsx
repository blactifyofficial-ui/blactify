"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url";

interface HeroProps {
    images: string[];
}

export function Hero({ images }: HeroProps) {
    const container = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
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
            const nextIndex = (currentImageIndex + 1) % images.length;
            const els = container.current?.querySelectorAll(".hero-bg-image");
            if (els) {
                gsap.to(els[currentImageIndex], { opacity: 0, scale: 1, duration: 2, ease: "power2.inOut" });
                gsap.to(els[nextIndex], { opacity: 1, scale: 1.05, duration: 2, ease: "power2.inOut" });
            }
            setCurrentImageIndex(nextIndex);
        }, 5000);
        return () => clearInterval(interval);
    }, [currentImageIndex, images.length]);

    // Animations
    useGSAP(() => {
        // Entry animation for CTA
        gsap.fromTo(ctaRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, delay: 0.5 }
        );

        // Subtle slow Ken Burns on the first visible image
        gsap.to(".hero-bg-image:first-child", {
            scale: 1.08,
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: container });

    return (
        <section
            ref={container}
            className="relative h-[55vh] md:h-[85vh] w-full bg-white z-10 overflow-hidden"
        >
            {/* Background Images Wrapper (Clips the images) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                {images.map((img, i) => (
                    <div
                        key={`${img}-${i}`}
                        className={cn(
                            "hero-bg-image absolute inset-0 w-full h-full will-change-transform",
                            i === 0 ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <Image
                            src={optimizeCloudinaryUrl(img, 1200)}
                            alt="Collection"
                            fill
                            sizes="100vw"
                            className="object-contain"
                            priority={i === 0}
                        />
                    </div>
                ))}

                {/* Grain / Noise (Must stay inside current clip) */}
                <div className="absolute inset-0 noise-bg pointer-events-none z-[1]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
                {/* CTA ONLY */}
                <div ref={ctaRef}>
                    <Link
                        href="/shop"
                        onClick={handleClick}
                        className={cn(
                            "group relative inline-flex items-center gap-2.5 px-6 py-2.5 bg-white/40 backdrop-blur-xl text-black text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] rounded-full border border-white/30 overflow-hidden transition-all duration-500 hover:bg-white/60 hover:tracking-[0.4em] active:scale-95 shadow-2xl shadow-black/20",
                            isClicked && "bg-white/60 tracking-[0.4em]"
                        )}
                    >
                        {/* Logo Animation */}
                        <div className={cn(
                            "relative flex items-center max-w-0 opacity-0 -translate-x-3 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:max-w-[40px] group-hover:opacity-100 group-hover:translate-x-0",
                            isClicked && "max-w-[40px] opacity-100 translate-x-0"
                        )}>
                            <Image
                                src="/welcome-eye.png"
                                alt="Logo"
                                width={24}
                                height={24}
                                className={cn(
                                    "object-contain min-w-[24px] transition-transform duration-500 group-hover:scale-110",
                                    isClicked && "scale-110"
                                )}
                            />
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
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/[0.03] blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/[0.03] blur-[100px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </section>
    );
}

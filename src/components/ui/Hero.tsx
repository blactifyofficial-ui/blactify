"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url";

interface HeroProps {
    images: string[];
}

export function Hero({ images }: HeroProps) {
    const container = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const taglineRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

    // Entry animations
    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        tl.fromTo(logoRef.current,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.4, delay: 0.3 }
        );

        tl.fromTo(taglineRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1 },
            "-=0.6"
        );

        tl.fromTo(ctaRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 },
            "-=0.5"
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
            className="relative h-[85vh] w-full overflow-hidden bg-white"
        >
            {/* Background Images */}
            <div className="absolute inset-0 w-full h-full">
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

            </div>

            {/* Grain / Noise */}
            <div className="absolute inset-0 noise-bg pointer-events-none z-[1]" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
                {/* Logo */}
                <div ref={logoRef} className="relative w-28 h-28 md:w-40 md:h-40 lg:w-52 lg:h-52 mb-8">
                    <Image
                        src="/welcome-eye.png"
                        alt="Blactify"
                        fill
                        className="object-contain filter invert brightness-200 drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]"
                        priority
                    />
                </div>

                {/* Tagline */}
                <div ref={taglineRef} className="text-center mb-10 max-w-xl">
                    <p className="text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] mb-4">
                        Meets Timeless Essentials
                    </p>
                    <p className="text-white/30 text-[10px] md:text-xs tracking-widest leading-relaxed max-w-sm mx-auto">
                        Curated premium apparel & accessories designed for the modern individual
                    </p>
                </div>

                {/* CTA */}
                <div ref={ctaRef}>
                    <Link
                        href="/shop"
                        className="group relative inline-flex items-center gap-3 px-10 py-4 bg-white text-[#0a0a0a] text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] overflow-hidden transition-all duration-500 hover:tracking-[0.5em] active:scale-95"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Shop Now
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1.5" />
                        </span>
                        <div className="absolute inset-0 bg-zinc-200 translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-y-0" />
                    </Link>
                </div>
            </div>

            {/* Bottom metadata (desktop) */}
            <div className="absolute bottom-8 left-0 w-full px-12 hidden md:flex items-end justify-between z-10 text-white/20 text-[9px] uppercase tracking-[0.3em]">
                <div className="flex gap-12">
                    <div className="flex flex-col gap-1">
                        <span className="text-white/40">Founded</span>
                        <span>MMXXIII</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-white/40">Location</span>
                        <span>Worldwide</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-white/40">Scroll to explore</span>
                    <div className="w-px h-10 bg-white/15 mt-1" />
                </div>
            </div>

            {/* Corner ambient lights */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/[0.03] blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/[0.03] blur-[100px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </section>
    );
}

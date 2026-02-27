"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";

interface HeroProps {
    title: string | React.ReactNode;
    images: string[];
    ctaText?: string;
    ctaLink?: string;
}

export function Hero({ title, images, ctaText, ctaLink }: HeroProps) {
    const router = useRouter();
    const container = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subTitleRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLAnchorElement>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Image Cycle
    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            const nextIndex = (currentImageIndex + 1) % images.length;

            // GSAP Crossfade
            const images_els = container.current?.querySelectorAll('.hero-bg-image');
            if (images_els) {
                gsap.to(images_els[currentImageIndex], { opacity: 0, duration: 2, ease: "power2.inOut" });
                gsap.to(images_els[nextIndex], { opacity: 1, duration: 2, ease: "power2.inOut" });
            }

            setCurrentImageIndex(nextIndex);
        }, 6000);
        return () => clearInterval(interval);
    }, [currentImageIndex, images.length]);

    // Entry Animations
    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        // Split text animation for title if it's a string, otherwise just fade in
        if (typeof title === 'string') {
            tl.fromTo(titleRef.current,
                { y: 100, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.5, delay: 0.2 }
            );
        } else {
            tl.fromTo(titleRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, delay: 0.2 }
            );
        }

        tl.fromTo(subTitleRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 0.6, duration: 1 },
            "-=0.8"
        );

        tl.fromTo(ctaRef.current,
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1 },
            "-=0.6"
        );

        // Subtle background scale
        gsap.to(".hero-bg-container", {
            scale: 1.05,
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: container });

    return (
        <section
            ref={container}
            className="relative h-[90vh] w-full overflow-hidden bg-[#121212] noise-bg"
        >
            {/* Background Images */}
            <div className="hero-bg-container absolute inset-0 w-full h-full">
                {images.map((img, index) => (
                    <div
                        key={`${img}-${index}`}
                        className={cn(
                            "hero-bg-image absolute inset-0 w-full h-full",
                            index === 0 ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <Image
                            src={img}
                            alt="Hero Background"
                            fill
                            sizes="100vw"
                            className="object-cover"
                            priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                    </div>
                ))}
            </div>

            {/* Grain Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10" />

            {/* Content Layout */}
            <div className="relative z-20 h-full w-full flex flex-col items-center justify-center px-6 text-center">
                <div
                    ref={subTitleRef}
                    className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.3em] text-white/80"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Premium Collection 2024
                </div>

                <div
                    ref={titleRef}
                    className="mb-10 flex items-center justify-center transform-gpu"
                >
                    {typeof title === 'string' ? (
                        <h1 className="text-white text-4xl md:text-7xl lg:text-[10rem] font-heading leading-[0.85] tracking-tightest drop-shadow-2xl">
                            {title}
                        </h1>
                    ) : (
                        title
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                    <a
                        ref={ctaRef}
                        href={ctaLink || "/shop"}
                        className="group relative px-10 py-5 bg-white text-black text-xs font-bold uppercase tracking-[0.4em] overflow-hidden transition-all duration-300 hover:px-14 active:scale-95"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {ctaText || "Shop Collection"}
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                        <div className="absolute inset-0 bg-zinc-200 translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
                    </a>

                    <div className="hidden md:flex flex-col items-start text-left max-w-[200px]">
                        <p className="text-white/40 text-[9px] uppercase tracking-widest leading-loose">
                            Curated essentials designed for the modern individual. Quality meets aesthetics.
                        </p>
                    </div>
                </div>

                {/* Bottom Stats or Decorative elements */}
                <div className="absolute bottom-12 left-0 w-full px-12 hidden md:flex items-end justify-between text-white/30 text-[9px] uppercase tracking-[0.3em]">
                    <div className="flex gap-12">
                        <div className="flex flex-col gap-1">
                            <span className="text-white/60">Founded</span>
                            <span>MMXXIII</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-white/60">Location</span>
                            <span>Worldwide</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-white/60">Scroll to explore</span>
                        <div className="w-px h-12 bg-white/20 mt-2 origin-top scale-y-100 transition-transform duration-500 hover:scale-y-150" />
                    </div>
                </div>
            </div>

            {/* Decorative Corner Lights */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </section>
    );
}

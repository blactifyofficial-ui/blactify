"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeroProps {
    title: string;
    subtitle?: string;
    images: string[];
    ctaText?: string;
    ctaLink?: string;
}

export function Hero({ title, subtitle, images, ctaText, ctaLink }: HeroProps) {
    const router = useRouter();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showFullText, setShowFullText] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [images.length]);

    // Handle toggle for the CTA area (eye vs Shop Now)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isHovered && !isAnimating) {
                setShowFullText((prev) => !prev);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isHovered, isAnimating]);

    const handleCTAClick = (e: React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isAnimating) return;

        setIsAnimating(true);

        if (!showFullText) {
            // It's the eye icon. Highlight it first, then transition.
            setTimeout(() => {
                setShowFullText(true);
                // After transitioning to "Shop Now", wait a bit then navigate
                setTimeout(() => {
                    if (ctaLink) {
                        router.push(ctaLink);
                    }
                    setIsAnimating(false);
                }, 800);
            }, 400); // Eye highlights for 400ms
        } else {
            // It's already "Shop Now". Highlight and then navigate.
            setTimeout(() => {
                if (ctaLink) {
                    router.push(ctaLink);
                }
                setIsAnimating(false);
            }, 400); // "Shop Now" highlights for 400ms
        }
    };

    return (
        <section className="relative h-[80vh] w-full overflow-hidden bg-zinc-100">
            {images.map((img, index) => (
                <div
                    key={img}
                    className={cn(
                        "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                        index === currentImageIndex ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Image
                        src={img}
                        alt={title}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            ))}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#333639] z-10">
                <h1 className="font-empire text-3xl md:text-5xl lg:text-7xl mb-4 md:mb-8 opacity-90 uppercase leading-none tracking-tighter drop-shadow-2xl">
                    {title}
                </h1>

                <div
                    className="relative h-48 w-72 flex items-center justify-center overflow-hidden cursor-pointer"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleCTAClick}
                >
                    {/* Eye Icon Slide */}
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out",
                            showFullText ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-40 hover:opacity-100 active:opacity-100",
                            isAnimating && !showFullText && "opacity-100 scale-110"
                        )}
                    >
                        <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform duration-300">
                            <Image
                                src="/welcome-eye.png"
                                alt="Logo Icon"
                                fill
                                sizes="(max-width: 768px) 96px, 128px"
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* Shop Now Slide */}
                    {ctaLink && (
                        <div
                            className={cn(
                                "absolute inset-0 flex items-center justify-center text-[10px] md:text-sm font-bold uppercase tracking-[0.4em] transition-all duration-700 ease-in-out",
                                showFullText ? "translate-y-0 opacity-40 hover:opacity-100 active:opacity-100" : "translate-y-full opacity-0 pointer-events-none",
                                isAnimating && showFullText && "opacity-100 scale-110"
                            )}
                        >
                            {ctaText || "Shop Now"}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeroProps {
    title: string;
    subtitle?: string;
    images: string[];
    ctaText?: string;
    ctaLink?: string;
}

export function Hero({ title, subtitle, images, ctaText, ctaLink }: HeroProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showFullText, setShowFullText] = useState(false);

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
            setShowFullText((prev) => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

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
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            ))}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#333639] z-10">
                <h1 className="font-empire mb-8 opacity-80">
                    {title}
                </h1>

                <div className="relative h-72 w-96 flex items-center justify-center overflow-hidden">
                    {/* Eye Icon Slide */}
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out",
                            showFullText ? "-translate-y-full opacity-0" : "translate-y-0 opacity-40 shadow-2xl"
                        )}
                    >
                        <div className="relative w-48 h-48 md:w-64 md:h-64 transition-transform duration-300 hover:scale-110 active:scale-95 cursor-pointer">
                            <Image
                                src="/logo-eye-cropped.png"
                                alt="Logo Icon"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* Shop Now Slide */}
                    {ctaLink && (
                        <Link
                            href={ctaLink}
                            className={cn(
                                "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out text-[10px] md:text-sm font-bold uppercase tracking-[0.4em] transition-all duration-300 hover:scale-110 active:scale-95",
                                showFullText ? "translate-y-0 opacity-40 hover:opacity-100" : "translate-y-full opacity-0"
                            )}
                        >
                            {ctaText || "Shop Now"}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroProps {
    title: string;
    subtitle?: string;
    images: string[];
    ctaText?: string;
    ctaLink?: string;
}

export function Hero({ title, subtitle, images, ctaText, ctaLink }: HeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <section className="relative h-[80vh] w-full overflow-hidden bg-zinc-100">
            {images.map((image, index) => (
                <div
                    key={image + index}
                    className={cn(
                        "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                        index === currentIndex ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Image
                        src={image}
                        alt={`${title} - image ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            ))}

            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                <h1 className="font-empire text-5xl md:text-7xl mb-4 leading-none drop-shadow-lg">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mb-8 text-lg font-medium tracking-tight opacity-90 drop-shadow-md">
                        {subtitle}
                    </p>
                )}
                {ctaText && ctaLink && (
                    <a
                        href={ctaLink}
                        className="rounded-full bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        {ctaText}
                    </a>
                )}
            </div>

            {/* Pagination dots */}
            {images.length > 1 && (
                <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-1.5 transition-all duration-300 rounded-full",
                                index === currentIndex ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

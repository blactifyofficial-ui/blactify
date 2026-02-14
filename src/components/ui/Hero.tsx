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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [images.length]);

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
                <h1 className="font-empire mb-8">
                    {title}
                </h1>
                <div className="relative w-16 h-16 md:w-20 md:h-20 opacity-40 transition-all hover:opacity-100 duration-500 hover:scale-110">
                    <Image
                        src="/icon.png"
                        alt="Logo Icon"
                        fill
                        className="object-contain"
                    />
                </div>
            </div>
        </section>
    );
}

"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showFullText, setShowFullText] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Background Image Animation
    useGSAP(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (currentImageIndex + 1) % images.length;

            // Fade out current, fade in next
            gsap.to(`.hero-image-${currentImageIndex}`, { opacity: 0, duration: 1.5, ease: "power2.inOut" });
            gsap.to(`.hero-image-${nextIndex}`, { opacity: 1, duration: 1.5, ease: "power2.inOut" });

            setCurrentImageIndex(nextIndex);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentImageIndex, images.length]);

    // Title Entry Animation
    useGSAP(() => {
        gsap.fromTo(titleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 0.85, duration: 1.2, ease: "power3.out", delay: 0.5 }
        );
    }, { scope: container });

    // Handle toggle for the CTA area (eye vs Shop Now)
    useGSAP(() => {
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
            setShowFullText(true);
            setTimeout(() => {
                if (ctaLink) router.push(ctaLink);
                setIsAnimating(false);
            }, 800);
        } else {
            setTimeout(() => {
                if (ctaLink) router.push(ctaLink);
                setIsAnimating(false);
            }, 400);
        }
    };

    return (
        <section ref={container} className="relative h-[80vh] w-full overflow-hidden bg-zinc-100">
            {images.map((img, index) => (
                <div
                    key={`${img}-${index}`}
                    className={cn(
                        "absolute inset-0 transition-opacity",
                        `hero-image-${index}`,
                        index === 0 ? "opacity-100" : "opacity-0"
                    )}
                >
                    <Image
                        src={img}
                        alt={typeof title === 'string' ? title : "Hero Image"}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            ))}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#333639] z-10">
                <h1
                    ref={titleRef}
                    className="font-empire text-3xl md:text-5xl lg:text-7xl mb-4 md:mb-8 opacity-0 uppercase leading-none tracking-tighter drop-shadow-2xl"
                >
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

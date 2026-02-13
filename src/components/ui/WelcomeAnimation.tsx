"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function WelcomeAnimation() {
    const [isVisible, setIsVisible] = useState(true);
    const [isOpening, setIsOpening] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Check if we've already shown the animation in this session
        const hasShown = sessionStorage.getItem("welcome-animation-shown");
        const urlParams = new URLSearchParams(window.location.search);
        const force = urlParams.get("force") === "true";

        if (hasShown && !force) {
            setIsVisible(false);
            return;
        }

        // Start the opening animation after a short delay
        const openingTimer = setTimeout(() => {
            setIsOpening(true);
        }, 500);

        // Start fading out the entire overlay after the eye is "open"
        const fadeOutTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, 2500);

        // Completely remove the component
        const removeTimer = setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem("welcome-animation-shown", "true");
        }, 3200);

        return () => {
            clearTimeout(openingTimer);
            clearTimeout(fadeOutTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-700 ease-in-out",
                isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                {/* The Eye Icon */}
                <div className="relative w-full h-full">
                    <Image
                        src="/icon.png"
                        alt="Blactify"
                        fill
                        className="object-contain"
                        priority
                    />

                    {/* Radiating Lines (Eyelashes) - Hand-drawn style */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Top 3 lines */}
                        {[-45, 0, 45].map((angle, i) => (
                            <div
                                key={`top-${i}`}
                                className={cn(
                                    "absolute top-1/2 left-1/2 w-[3px] bg-black rounded-full transition-all duration-700 ease-out",
                                    isOpening ? "opacity-100 scale-y-100 h-8" : "opacity-0 scale-y-0 h-0"
                                )}
                                style={{
                                    transform: `translateX(-50%) translateY(-50%) rotate(${angle}deg) translateY(-60px)`,
                                    transformOrigin: 'bottom center'
                                }}
                            />
                        ))}
                        {/* Bottom 2 lines */}
                        {[-30, 30].map((angle, i) => (
                            <div
                                key={`bottom-${i}`}
                                className={cn(
                                    "absolute top-1/2 left-1/2 w-[3px] bg-black rounded-full transition-all duration-700 ease-out",
                                    isOpening ? "opacity-100 scale-y-100 h-8" : "opacity-0 scale-y-0 h-0"
                                )}
                                style={{
                                    transform: `translateX(-50%) translateY(-50%) rotate(${angle}deg) translateY(60px)`,
                                    transformOrigin: 'top center'
                                }}
                            />
                        ))}
                    </div>

                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                        {/* Top Lid */}
                        <div
                            className={cn(
                                "flex-1 bg-white transition-transform duration-1000 ease-in-out origin-top",
                                isOpening ? "-translate-y-full" : "translate-y-0"
                            )}
                        />
                        {/* Bottom Lid */}
                        <div
                            className={cn(
                                "flex-1 bg-white transition-transform duration-1000 ease-in-out origin-bottom",
                                isOpening ? "translate-y-full" : "translate-y-0"
                            )}
                        />
                    </div>
                </div>

                {/* Optional: A subtle glow or pulse after opening */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full bg-black/5 scale-0 transition-transform duration-500 delay-700",
                        isOpening ? "scale-150 blur-2xl" : ""
                    )}
                />
            </div>

            {/* Branding Text (Optional, keeping it minimal as requested) */}
            <div
                className={cn(
                    "absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-700 delay-1000",
                    isOpening ? "opacity-40 translate-y-0" : "opacity-0 translate-y-4"
                )}
            >
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-black">
                    Meets Timeless Essentials
                </p>
            </div>
        </div>
    );
}

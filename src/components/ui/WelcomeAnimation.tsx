"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function WelcomeAnimation() {
    const [isVisible, setIsVisible] = useState<boolean | null>(null);
    const [isOpening, setIsOpening] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Check if we've already shown the animation in this session
        const hasShown = sessionStorage.getItem("welcome-animation-shown");
        const urlParams = new URLSearchParams(window.location.search);
        const forceWelcome = urlParams.get("force-welcome") === "true";

        if (hasShown && !forceWelcome) {
            setIsVisible(false);
            return;
        }

        // If not seen or forced, make it visible
        setIsVisible(true);

        // Start the opening animation after a short delay
        const openingTimer = setTimeout(() => {
            setIsOpening(true);
        }, 1500);

        // Start the iris reveal effect (thematic replacement for zoom)
        const revealTimer = setTimeout(() => {
            setIsRevealing(true);
        }, 4500);

        // Start fading out the entire overlay
        const fadeOutTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, 5200);

        // Completely remove the component
        const removeTimer = setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem("welcome-animation-shown", "true");
        }, 7000);

        return () => {
            clearTimeout(openingTimer);
            clearTimeout(revealTimer);
            clearTimeout(fadeOutTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (isVisible === false || isVisible === null) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center",
                isOpening ? "bg-white" : "bg-black",
                isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100",
                isRevealing ? "blur-md" : "blur-0"
            )}
            style={{
                clipPath: isRevealing ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)',
                transition: 'clip-path 2500ms ease-in-out, opacity 1000ms ease-in-out, background-color 2500ms ease-in-out, backdrop-filter 2500ms ease-in-out, filter 2500ms ease-in-out'
            }}
        >
            <div className={cn(
                "relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center transition-all duration-[2500ms] ease-in-out",
                isRevealing ? "scale-150" : "scale-100"
            )}>
                <Image
                    src="/welcome-eye.png"
                    alt="Welcome"
                    width={320}
                    height={320}
                    priority
                    sizes="(max-width: 768px) 256px, 320px"
                    className={cn(
                        "w-full h-full object-contain transition-opacity duration-[2000ms] ease-in-out mix-blend-multiply",
                        isOpening ? "opacity-100" : "opacity-0"
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
                <p className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.4em] transition-colors duration-700",
                    isOpening ? "text-black" : "text-white/40"
                )}>
                    Meets Timeless Essentials
                </p>
            </div>
        </div>
    );
}

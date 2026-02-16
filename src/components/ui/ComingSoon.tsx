"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComingSoon() {
    const [email, setEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isOpening, setIsOpening] = useState(false);

    useEffect(() => {
        // Trigger entrance animation like the WelcomeAnimation component
        const timer = setTimeout(() => setIsOpening(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setEmail("");
        }
    };

    return (
        <div className="relative min-h-screen bg-white text-black overflow-hidden font-sans selection:bg-black selection:text-white">
            {/* Background Branding (Motion like WelcomeAnimation) */}
            <div className="absolute inset-0 flex items-center justify-center p-8 opacity-5">
                <span className={cn(
                    "font-heading text-[30vw] md:text-[40vw] leading-none tracking-tighter italic font-black transition-all duration-1000",
                    isOpening ? "translate-y-0 opacity-10" : "translate-y-20 opacity-0"
                )}>
                    BLACTIFY
                </span>
            </div>

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 text-center">
                {/* Logo Section */}
                <div className={cn(
                    "mb-12 transition-all duration-1000 delay-300",
                    isOpening ? "scale-100 opacity-100" : "scale-90 opacity-0"
                )}>
                    <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mix-blend-multiply transition-transform hover:rotate-1 duration-500">
                        <Image
                            src="/logo.webp"
                            alt="Blactify Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Content Overlay - Styled like WelcomeBanner.tsx */}
                <div className={cn(
                    "w-full max-w-xl mx-auto rounded-[48px] bg-black/5 backdrop-blur-xl border border-black/5 p-12 md:p-16 space-y-10 transition-all duration-1000 delay-500",
                    isOpening ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                )}>
                    <div className="space-y-4">
                        <h1 className="font-heading text-6xl md:text-8xl tracking-tighter leading-[0.85] font-black italic">
                            COMING<br />SOON
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">
                            The Premium Minimalist Experience
                        </p>
                    </div>

                    <p className="text-zinc-500 text-sm md:text-base leading-relaxed max-w-sm mx-auto">
                        We are currently refining our curated collection of timeless essentials. Precision engineering takes time.
                    </p>

                    <div className="pt-4">
                        {isSubscribed ? (
                            <div className="py-6 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest animate-in zoom-in duration-500">
                                You&apos;re on the list.
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="relative group">
                                <input
                                    type="email"
                                    required
                                    placeholder="ENTER EMAIL FOR EARLY ACCESS"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/50 border border-black/10 rounded-full px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] outline-none focus:border-black/30 transition-all placeholder:text-zinc-300"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg"
                                >
                                    <Eye size={18} />
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="pt-8 grid grid-cols-2 gap-8 border-t border-black/5">
                        <div className="text-left space-y-1">
                            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Protocol</span>
                            <p className="text-[10px] font-bold uppercase">Mobile-First UI</p>
                        </div>
                        <div className="text-right space-y-1">
                            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Aesthetic</span>
                            <p className="text-[10px] font-bold uppercase">Timeless Noir</p>
                        </div>
                    </div>
                </div>

                {/* Subtitle - Like WelcomeAnimation */}
                <div className={cn(
                    "mt-12 transition-all duration-700 delay-1000",
                    isOpening ? "opacity-40 translate-y-0" : "opacity-0 translate-y-4"
                )}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-black">
                        Meets Timeless Essentials
                    </p>
                </div>
            </main>
        </div>
    );
}

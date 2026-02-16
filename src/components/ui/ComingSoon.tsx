"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, ShieldCheck, Mail, MapPin, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComingSoon() {
    const [email, setEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Slide up effect like WelcomeBanner
        const timer = setTimeout(() => setIsOpen(true), 100);
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
        <div className="relative min-h-screen bg-black overflow-hidden selection:bg-white selection:text-black">
            {/* Background Image / Placeholder (Matches the industrial vibe) */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-placeholder.jpg"
                    alt="Background"
                    fill
                    className="object-cover opacity-30 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Bottom Sheet Style Modal (Matches WelcomeBanner.tsx) */}
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 z-[100] transition-transform duration-1000 ease-out",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="w-full md:max-w-2xl mx-auto rounded-t-[60px] bg-black/80 backdrop-blur-3xl border-t border-white/10 p-12 md:p-20 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.8)] relative">
                    {/* Glowing Eye Icon */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-black rounded-full border border-white/10 flex items-center justify-center shadow-2xl">
                        <div className="animate-eye-glow text-white">
                            <Eye size={40} strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="text-center flex flex-col gap-10">
                        {/* Title Section */}
                        <div className="space-y-4">
                            <h2 className="font-heading text-6xl md:text-8xl tracking-tighter leading-none font-black italic">
                                Coming Soon
                            </h2>
                            <p className="text-zinc-400 text-xs md:text-sm font-bold uppercase tracking-[0.4em]">
                                The Premium Minimalist Experience
                            </p>
                        </div>

                        {/* Description */}
                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-md mx-auto">
                            We are refining a curated collection of essentials designed for the modern lifestyle. Precision engineering takes time.
                        </p>

                        {/* Subscription Block */}
                        <div className="max-w-md mx-auto w-full pt-4">
                            {isSubscribed ? (
                                <div className="p-6 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl animate-in zoom-in duration-500 flex items-center justify-center gap-3">
                                    <BadgeCheck size={18} />
                                    <span>Access Granted. Awaiting Distribution.</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="relative group">
                                    <input
                                        type="email"
                                        required
                                        placeholder="ENTER EMAIL FOR EARLY ACCESS"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-10 py-6 text-[11px] font-bold uppercase tracking-[0.2em] outline-none focus:border-white/30 transition-all placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                                    >
                                        <Eye size={22} />
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Trust Badges / Footer Info */}
                        <div className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 opacity-60">
                            <div className="flex flex-col items-center gap-2">
                                <ShieldCheck size={18} className="text-zinc-500" />
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Aesthetic Security</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Mail size={18} className="text-zinc-500" />
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Instant Updates</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <MapPin size={18} className="text-zinc-500" />
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Global Logistic</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Static Branding Background */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-20 z-0">
                <h1 className="font-heading text-[15vw] leading-none tracking-tighter italic font-black text-white/10">
                    BLACTIFY
                </h1>
            </div>

            {/* Float Design Credits */}
            <div className="fixed bottom-4 left-6 z-[110] opacity-20">
                <span className="text-[10px] text-white font-bold uppercase tracking-[0.5em]">
                    &copy; 2026
                </span>
            </div>
        </div>
    );
}

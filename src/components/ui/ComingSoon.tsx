"use client";

import { useState } from "react";
import Image from "next/image";
import { Instagram, Twitter, Mail, ArrowRight, ShieldCheck, Zap, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComingSoon() {
    const [email, setEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setEmail("");
        }
    };

    return (
        <div className="relative min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden font-sans">
            {/* Background Aesthetic Elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-zinc-200/40 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-zinc-100/30 blur-[120px] rounded-full animate-pulse" />

            {/* Content Container */}
            <div className="relative z-10 max-w-2xl w-full text-center space-y-16">
                {/* Logo Section */}
                <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="relative w-48 h-48 md:w-64 md:h-64 transition-transform hover:scale-105 duration-500">
                        <Image
                            src="/logo.webp"
                            alt="Blactify Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-black uppercase italic">
                            COMING SOON
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.4em]">
                            The Premium Minimalist Experience
                        </p>
                    </div>
                </div>

                {/* Notes Section (The "Another Notes") */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 text-center">
                    <div className="flex flex-col items-center space-y-3 p-6 rounded-[32px] bg-zinc-50 border border-zinc-100 backdrop-blur-sm transition-all hover:border-black/10 hover:shadow-xl hover:shadow-black/5">
                        <Smartphone className="w-5 h-5 text-black" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-black">Mobile-First UI</h3>
                        <p className="text-[10px] text-zinc-400 leading-relaxed uppercase">
                            Experience a seamless, app-like interface in your browser. Designed for high-speed, on-the-go shopping.
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-3 p-6 rounded-[32px] bg-zinc-50 border border-zinc-100 backdrop-blur-sm transition-all hover:border-black/10 hover:shadow-xl hover:shadow-black/5">
                        <Zap className="w-5 h-5 text-black" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-black">Noir Aesthetic</h3>
                        <p className="text-[10px] text-zinc-400 leading-relaxed uppercase">
                            High-contrast visuals inspired by streetwear culture and minimalist industrial design.
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-3 p-6 rounded-[32px] bg-zinc-50 border border-zinc-100 backdrop-blur-sm transition-all hover:border-black/10 hover:shadow-xl hover:shadow-black/5">
                        <ShieldCheck className="w-5 h-5 text-black" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-black">Direct Access</h3>
                        <p className="text-[10px] text-zinc-400 leading-relaxed uppercase">
                            Instant updates via WhatsApp and Email. Real-time tracking and automated post-purchase engagement.
                        </p>
                    </div>
                </div>

                {/* Additional Brand Note */}
                <div className="max-w-xl mx-auto py-4 animate-in fade-in duration-1000 delay-300">
                    <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-[0.2em] leading-relaxed italic">
                        "Curating a collection of high-aesthetic essentials for the modern shopper. Quality over quantity, always."
                    </p>
                </div>

                {/* Waitlist / Subscribe Form */}
                <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
                    <p className="text-sm text-zinc-400 font-medium">
                        Be the first to know when we go live.
                    </p>
                    {isSubscribed ? (
                        <div className="p-6 bg-black text-white rounded-[32px] animate-in zoom-in duration-500 flex items-center justify-center gap-3">
                            <ShieldCheck size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                You&apos;re on the list.
                            </span>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubscribe}
                            className="group flex flex-col md:flex-row gap-3 p-2 bg-zinc-100/50 backdrop-blur-xl border border-zinc-200 rounded-[40px] transition-all focus-within:bg-white focus-within:border-black/10 focus-within:shadow-2xl focus-within:shadow-black/5"
                        >
                            <input
                                type="email"
                                required
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-transparent px-6 py-4 text-sm text-black placeholder:text-zinc-400 outline-none"
                            />
                            <button
                                type="submit"
                                className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-zinc-800"
                            >
                                Notify Me
                                <ArrowRight size={14} />
                            </button>
                        </form>
                    )}
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-10 pt-12 border-t border-zinc-100 animate-in fade-in duration-1000 delay-700">
                    <a href="#" className="text-zinc-400 hover:text-black transition-all hover:scale-110">
                        <Instagram size={20} />
                    </a>
                    <a href="#" className="text-zinc-400 hover:text-black transition-all hover:scale-110">
                        <Twitter size={20} />
                    </a>
                    <a href="#" className="text-zinc-400 hover:text-black transition-all hover:scale-110">
                        <Mail size={20} />
                    </a>
                </div>
            </div>

            {/* Bottom Credits */}
            <div className="absolute bottom-8 left-0 right-0 text-center opacity-30">
                <span className="text-[9px] text-black font-bold uppercase tracking-[0.5em]">
                    &copy; 2026 BLACTIFY. ALL RIGHTS RESERVED.
                </span>
            </div>
        </div>
    );
}

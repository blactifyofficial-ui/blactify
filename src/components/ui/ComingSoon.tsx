"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Instagram, Twitter, Mail, ArrowRight } from "lucide-react";

export function ComingSoon() {
    const [showFullText, setShowFullText] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Handle branding loop (matches TopNavbar logic)
    useEffect(() => {
        const interval = setInterval(() => {
            setShowFullText((prev) => !prev);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setEmail("");
        }
    };

    return (
        <div className="relative min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Background Aesthetic Elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-zinc-200/40 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-zinc-100/30 blur-[120px] rounded-full" />

            {/* Content Container */}
            <div className="relative z-10 max-w-xl w-full text-center space-y-12">
                {/* Looping Brand Header */}
                <div className="relative h-20 flex items-center justify-center overflow-hidden">
                    <span
                        className={cn(
                            "font-empire text-5xl md:text-7xl text-black tracking-widest transition-all duration-1000 absolute",
                            showFullText ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
                        )}
                    >
                        BLACTIFY
                    </span>
                    <span
                        className={cn(
                            "font-empire text-3xl md:text-5xl text-zinc-400 tracking-tighter transition-all duration-1000 absolute",
                            showFullText ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                        )}
                    >
                        BLACTIFY ESSENTIALS
                    </span>
                </div>

                {/* Subtext */}
                <div className="space-y-4">
                    <h1 className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em]">
                        The Premium Minimalist Experience
                    </h1>
                    <p className="font-empire text-2xl md:text-4xl text-black leading-tight uppercase">
                        Coming Soon to Production
                    </p>
                    <p className="text-zinc-400 text-sm font-sans max-w-sm mx-auto leading-relaxed">
                        We are refining a curated collection of essentials designed for the modern lifestyle. Quality over quantity.
                    </p>
                </div>

                {/* Waitlist / Subscribe Form (Glassmorphism) */}
                <div className="max-w-md mx-auto">
                    {isSubscribed ? (
                        <div className="p-6 bg-black/5 backdrop-blur-xl border border-black/10 rounded-[32px] animate-in fade-in zoom-in duration-500">
                            <span className="text-black text-sm font-bold uppercase tracking-widest">
                                You&apos;re on the list.
                            </span>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubscribe}
                            className="flex flex-col md:flex-row gap-4 p-2 bg-black/5 backdrop-blur-xl border border-black/10 rounded-[40px] transition-all focus-within:border-black/20"
                        >
                            <input
                                type="email"
                                required
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-transparent px-6 py-4 text-sm text-black placeholder:text-zinc-400 outline-none"
                            />
                            <button
                                type="submit"
                                className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Notify Me
                                <ArrowRight size={14} />
                            </button>
                        </form>
                    )}
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-8 pt-8 border-t border-black/5">
                    <a href="#" className="text-zinc-400 hover:text-black transition-colors">
                        <Instagram size={20} />
                    </a>
                    <a href="#" className="text-zinc-400 hover:text-black transition-colors">
                        <Twitter size={20} />
                    </a>
                    <a href="#" className="text-zinc-400 hover:text-black transition-colors">
                        <Mail size={20} />
                    </a>
                </div>
            </div>

            {/* Bottom Credits */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-[0.4em]">
                    &copy; 2026 BLACTIFY. ALL RIGHTS RESERVED.
                </span>
            </div>
        </div>
    );
}

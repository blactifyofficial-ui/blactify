"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Instagram, Twitter, Mail, ArrowRight, Minus } from "lucide-react";
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

    const specs = useMemo(() => [
        { id: "01", label: "Architecture", value: "Mobile-First UX" },
        { id: "02", label: "Aesthetic", value: "Premium Noir" },
        { id: "03", label: "Logistics", value: "Real-time Tracking" },
        { id: "04", label: "Integrations", value: "WhatsApp / Email" }
    ], []);

    return (
        <div className="relative min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black overflow-hidden font-mono tracking-tight">
            {/* Architectural Grid */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Corner Markers */}
            <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-white/20" />
            <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-white/20" />
            <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-white/20" />
            <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-white/20" />

            <main className="relative z-10 min-h-screen flex flex-col md:flex-row">
                {/* Left Section: Branding & Identity */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-12 md:p-24 border-b md:border-b-0 md:border-r border-white/5">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-zinc-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            System Active - v1.0
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.8] mb-8">
                            BLAC<br />TIFY
                        </h1>
                    </div>

                    <div className="space-y-12">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter italic uppercase">Coming Soon</h2>
                            <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
                                We are engineering a curated ecosystem of high-aesthetic essentials. Pre-launch sequence initiated.
                            </p>
                        </div>

                        {/* Subscription Block */}
                        <div className="max-w-md">
                            {isSubscribed ? (
                                <div className="py-6 border-t border-white/10 flex items-center justify-between text-xs transition-all animate-in fade-in slide-in-from-left-4">
                                    <span className="uppercase tracking-widest">Awaiting Link Distribution</span>
                                    <span className="text-zinc-500">[ ACCESS GRANTED ]</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="group relative">
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter terminal email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-transparent border-b border-white/10 py-6 text-sm uppercase tracking-widest outline-none focus:border-white transition-all placeholder:text-zinc-800"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-0 bottom-6 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section: Spec Sheet & Identity */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-12 md:p-24 bg-white/[0.01]">
                    <div className="relative aspect-square w-full max-w-[300px] mx-auto opacity-40 mix-blend-screen grayscale">
                        <Image
                            src="/logo.webp"
                            alt="Core"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                            {specs.map((spec) => (
                                <div key={spec.id} className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest">
                                        <span>{spec.id}</span>
                                        <Minus className="w-3" />
                                        <span>{spec.label}</span>
                                    </div>
                                    <p className="text-xs uppercase font-bold tracking-wider">{spec.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-12 border-t border-white/10">
                            <div className="flex gap-6">
                                <a href="#" className="opacity-40 hover:opacity-100 transition-opacity">
                                    <Instagram size={18} />
                                </a>
                                <a href="#" className="opacity-40 hover:opacity-100 transition-opacity">
                                    <Twitter size={18} />
                                </a>
                                <a href="#" className="opacity-40 hover:opacity-100 transition-opacity">
                                    <Mail size={18} />
                                </a>
                            </div>
                            <span className="text-[10px] opacity-20 uppercase tracking-[0.3em]">
                                est. 2026
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Background Texture Overlay */}
            <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20"
                style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
        </div>
    );
}

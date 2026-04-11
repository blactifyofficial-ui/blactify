"use client";

import { useState, useEffect } from "react";
import { Zap, Clock } from "lucide-react";
import { Drop } from "@/lib/drops-local";

export function DropTimerCard({ drop, onComplete }: { drop: Drop, onComplete: () => void }) {
    const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(drop.publishDate).getTime();
            const diff = target - now;

            if (diff <= 0) {
                clearInterval(timer);
                onComplete();
                return;
            }

            setTimeLeft({
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                s: Math.floor((diff % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [drop, onComplete]);

    if (!timeLeft) return null;

    return (
        <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 h-[200px] flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Zap className="text-[#000000] fill-yellow-500" size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">Next Scheduled Drop</span>
                    </div>
                    <h4 className="text-2xl font-semibold text-[#000000] tracking-tighter leading-none pt-1">
                        {drop.name}
                    </h4>
                </div>
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                    <Clock size={18} />
                </div>
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex flex-col">
                    <span className="text-3xl font-semibold tracking-tighter tabular-nums leading-none text-[#000000]">{timeLeft.d.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-semibold uppercase tracking-wide text-zinc-500 mt-1">Days</span>
                </div>
                <div className="text-2xl font-semibold text-zinc-300 mb-1">:</div>
                <div className="flex flex-col">
                    <span className="text-3xl font-semibold tracking-tighter tabular-nums leading-none text-[#000000]">{timeLeft.h.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-semibold uppercase tracking-wide text-zinc-500 mt-1">Hrs</span>
                </div>
                <div className="text-2xl font-semibold text-zinc-300 mb-1">:</div>
                <div className="flex flex-col">
                    <span className="text-3xl font-semibold tracking-tighter tabular-nums leading-none text-[#000000]">{timeLeft.m.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-semibold uppercase tracking-wide text-zinc-600 mt-1">Mins</span>
                </div>
                <div className="text-2xl font-semibold text-zinc-300 mb-1">:</div>
                <div className="flex flex-col">
                    <span className="text-3xl font-semibold tracking-tighter tabular-nums text-yellow-600 leading-none">{timeLeft.s.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-semibold uppercase tracking-wide text-zinc-600 mt-1">Secs</span>
                </div>
            </div>
        </div>
    );
}

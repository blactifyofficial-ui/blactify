"use client";

import Link from "next/link";
import { Zap, Plus, ArrowUpRight } from "lucide-react";
import { DropTimerCard } from "./DropTimerCard";
import { Drop } from "@/lib/drops-local";

interface UpcomingDropsProps {
    drops: Drop[];
    fetchDrops: () => void;
}

export function UpcomingDrops({ drops, fetchDrops }: UpcomingDropsProps) {
    return (
        <div className="flex flex-col gap-6">
            {drops.length > 0 ? (
                <div className="relative group/slider h-[200px]">
                    <div className="flex h-full gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mb-4">
                        {drops.map((drop, idx) => (
                            <div key={drop.id} className="min-w-full h-full snap-center relative">
                                <DropTimerCard drop={drop} onComplete={fetchDrops} />
                                {drops.length > 1 && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 opacity-20 group-hover/slider:opacity-100 transition-opacity">
                                        {idx < drops.length - 1 && (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[7px] font-black uppercase tracking-widest text-zinc-400 rotate-90">Next</span>
                                                <ArrowUpRight size={10} className="text-zinc-400 rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Multi-drop dot indicators */}
                    {drops.length > 1 && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1 bg-zinc-50 rounded-full border border-zinc-100">
                            {drops.map((_, i) => (
                                <div key={i} className="w-1 h-1 rounded-full bg-zinc-400 opacity-30 last:mr-0 group-hover/slider:opacity-100" />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 h-[200px] flex flex-col justify-between group transition-all hover:border-black/5 hover:bg-white hover:shadow-xl hover:shadow-black/5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Zap className="text-zinc-200" size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Next Scheduled Drop</span>
                            </div>
                            <h4 className="text-2xl font-black text-zinc-200 tracking-tighter leading-none pt-1">
                                None Scheduled
                            </h4>
                        </div>
                    </div>
                    <Link 
                        href="/admin/drops" 
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                    >
                        Schedule Drop <Plus size={14} />
                    </Link>
                </div>
            )}
        </div>
    );
}

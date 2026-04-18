"use client";

import { BarChart3 } from "lucide-react";

interface MonthlyRevenue {
    month: string;
    amount: number;
}

interface SalesGrowthChartProps {
    revenueByMonth: MonthlyRevenue[];
}

export function SalesGrowthChart({ revenueByMonth }: SalesGrowthChartProps) {
    return (
        <div className="bg-black p-10 rounded-[3rem] shadow-2xl shadow-black/20 h-full flex flex-col justify-between group relative overflow-hidden border border-white/5">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                        <BarChart3 size={22} />
                        Sales Growth
                    </h3>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wide">LIVE</span>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-12">Monthly revenue overview</p>
            </div>

            <div className="h-72 flex items-end justify-between gap-4 relative z-10 px-2 mb-8">
                {revenueByMonth.map((item, i) => {
                    const maxVal = Math.max(...revenueByMonth.map(m => m.amount), 1);
                    const height = (item.amount / maxVal) * 100;
                    return (
                        <div key={item.month} className="flex-1 bg-white/5 rounded-t-2xl relative group/bar transition-all hover:bg-white/10 overflow-hidden h-full flex flex-col justify-end">
                            <div
                                className="w-full bg-white/10 rounded-t-xl transition-all duration-1000 ease-out group-hover/bar:bg-white group-hover/bar:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                style={{ height: `${Math.max(height, 5)}%`, transitionDelay: `${(revenueByMonth.length - 1 - i) * 100}ms` }}
                            />
                            <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-black text-[9px] font-black px-3 py-1.5 rounded-xl pointer-events-none transition-all duration-300 transform scale-75 group-hover/bar:scale-100 shadow-2xl whitespace-nowrap">
                                ₹{item.amount.toLocaleString()}
                            </div>
                            <div className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 text-[9px] font-black text-zinc-700 group-hover:text-zinc-500 transition-colors uppercase">
                                {item.month}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between items-center relative z-10 px-1 border-t border-white/5 pt-8 mt-6">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-wide">Start</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10"></div>)}
                </div>
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-wide">Current</span>
            </div>

            {/* Aesthetic Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('/noise.png')]"></div>
            {/* Interactive Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
        </div>
    );
}

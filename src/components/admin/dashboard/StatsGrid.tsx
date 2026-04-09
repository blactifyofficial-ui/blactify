"use client";

import { IndianRupee, ShoppingBag, Users, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";

interface StatsGridProps {
    stats: {
        totalRevenue: number;
        revenueGrowth: string;
        totalOrders: number;
        orderGrowth: string;
        activeUsers: number;
        userGrowth: string;
    };
}

export function StatsGrid({ stats }: StatsGridProps) {
    const statCards = [
        {
            name: "Total Revenue",
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: IndianRupee,
            change: stats.revenueGrowth,
            trendingUp: !stats.revenueGrowth.startsWith('-')
        },
        {
            name: "Total Orders",
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingBag,
            change: stats.orderGrowth,
            trendingUp: !stats.orderGrowth.startsWith('-')
        },
        {
            name: "Active Users",
            value: stats.activeUsers.toLocaleString(),
            icon: Users,
            change: stats.userGrowth,
            trendingUp: !stats.userGrowth.startsWith('-')
        },
        {
            name: "System Status",
            value: "Optimal",
            icon: CheckCircle2,
            change: "Live",
            trendingUp: true
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {statCards.map((stat) => (
                <AdminCard key={stat.name} className="group relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-inner group-hover:shadow-black/20">
                            <stat.icon size={24} className="group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <span className={cn(
                            "text-[9px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border",
                            stat.trendingUp ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                        )}>
                            {stat.trendingUp ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                            {stat.change}
                        </span>
                    </div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1 group-hover:text-zinc-600 transition-colors">{stat.name}</p>
                    <h3 className="text-2xl font-black tracking-tight text-black group-hover:translate-x-1 transition-transform duration-500">{stat.value}</h3>

                    {/* Interactive aesthetic background element */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-50/50 rounded-full blur-3xl group-hover:bg-zinc-100/80 transition-all duration-700 -z-10 group-hover:scale-150"></div>
                </AdminCard>
            ))}
        </div>
    );
}

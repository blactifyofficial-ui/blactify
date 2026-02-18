"use client";

import Link from "next/link";
import {
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    IndianRupee,
    BarChart3,
    Activity,
    CheckCircle2
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
    const { stats, loading } = useAdminStats();

    const statCards = [
        { name: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, change: "+12.5%", trendingUp: true },
        { name: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, change: "+3.2%", trendingUp: true },
        { name: "Active Users", value: stats.activeUsers, icon: Users, change: "+18%", trendingUp: true },
        { name: "System Status", value: "Optimal", icon: CheckCircle2, change: "Live", trendingUp: true },
    ];

    if (loading) return <AdminLoading message="Synthesizing intelligence protocol..." />;

    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            <AdminPageHeader
                title="Intelligence"
                subtitle="Real-time performance metrics and global store diagnostics"
            >
                <div className="flex items-center gap-3 px-5 py-2.5 bg-black text-white rounded-full shadow-2xl shadow-black/20 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Quantum Core Active</span>
                </div>
            </AdminPageHeader>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, idx) => (
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
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1 italic group-hover:text-zinc-600 transition-colors">{stat.name}</p>
                        <h3 className="text-2xl font-black tracking-tight text-black group-hover:translate-x-1 transition-transform duration-500">{stat.value}</h3>

                        {/* Interactive aesthetic background element */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-50/50 rounded-full blur-3xl group-hover:bg-zinc-100/80 transition-all duration-700 -z-10 group-hover:scale-150"></div>
                    </AdminCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Recent Activity */}
                <div className="lg:col-span-3">
                    <AdminCard
                        title="Quantum Stream"
                        subtitle="Latest logistical deployments across the high-frequency registry"
                        icon={<Activity size={18} />}
                    >
                        <div className="space-y-6">
                            {stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order, idx) => (
                                    <Link
                                        key={order.id}
                                        href={`/admin/orders/${order.id}`}
                                        className="flex items-center justify-between p-5 bg-white border border-zinc-50 rounded-[2.5rem] hover:border-black/5 hover:bg-zinc-50/50 hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group/item"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-xl group-hover/item:scale-105 transition-transform duration-500 font-aesthetic">
                                                {order.customer_details?.name?.[0]?.toUpperCase() || "#"}
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-black text-black group-hover/item:translate-x-1 transition-transform duration-500">{order.customer_details?.name || "REDACTED CLIENT"}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-full">#{order.id.slice(0, 8)}</span>
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm",
                                                        order.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                    )}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black tracking-tight text-black">₹{order.amount.toLocaleString()}</p>
                                            <p className="text-[9px] text-zinc-300 font-black uppercase tracking-widest italic">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="py-24 text-center">
                                    <ShoppingBag className="mx-auto text-zinc-50 mb-6 opacity-50" size={64} />
                                    <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">Zero Activity</h4>
                                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic leading-loose px-10">
                                        The high-frequency registry is currently dormant. No active deployments detected.
                                    </p>
                                </div>
                            )}
                        </div>
                    </AdminCard>
                </div>

                {/* Performance Analytics (Chart) */}
                <div className="lg:col-span-2">
                    <div className="bg-black p-10 rounded-[3rem] shadow-2xl shadow-black/20 h-full flex flex-col justify-between group relative overflow-hidden border border-white/5">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                                    <BarChart3 size={22} />
                                    Velocity Pulse
                                </h3>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">High Freq</span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic mb-12">Dynamic revenue projection across temporal nodes</p>
                        </div>

                        <div className="h-72 flex items-end justify-between gap-4 relative z-10 px-2 mb-8">
                            {stats.revenueByMonth.map((item, i) => {
                                const maxVal = Math.max(...stats.revenueByMonth.map(m => m.amount), 1);
                                const height = (item.amount / maxVal) * 100;
                                return (
                                    <div key={item.month} className="flex-1 bg-white/5 rounded-t-2xl relative group/bar transition-all hover:bg-white/10 overflow-hidden h-full flex flex-col justify-end">
                                        <div
                                            className="w-full bg-white/10 rounded-t-xl transition-all duration-1000 ease-out group-hover/bar:bg-white group-hover/bar:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                            style={{ height: `${Math.max(height, 5)}%`, transitionDelay: `${(stats.revenueByMonth.length - 1 - i) * 100}ms` }}
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
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] font-aesthetic">Genesis Node</span>
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10"></div>)}
                            </div>
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] font-aesthetic">Zenith Node</span>
                        </div>

                        {/* Aesthetic Noise Overlay */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('/noise.png')]"></div>
                        {/* Interactive Glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

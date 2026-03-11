"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    IndianRupee,
    BarChart3,
    Activity,
    CheckCircle2,
    Store,
    AlertTriangle,
    X,
    Lock,
    Unlock,
    Truck,
    Zap,
    Clock,
    Plus
} from "lucide-react";
import { Drop } from "@/lib/drops-local";
import { useAdminStats } from "@/hooks/useAdminStats";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { getStoreSettings, togglePurchaseStatus, toggleFreeShippingStatus } from "@/app/actions/settings";

function DropTimerCard({ drop, onComplete }: { drop: Drop, onComplete: () => void }) {
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Next Scheduled Drop</span>
                    </div>
                    <h4 className="text-2xl font-black text-[#000000] tracking-tighter leading-none pt-1">
                        {drop.name}
                    </h4>
                </div>
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                    <Clock size={18} />
                </div>
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter tabular-nums leading-none text-[#000000]">{timeLeft.d.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mt-1">Days</span>
                </div>
                <div className="text-2xl font-black text-zinc-300 mb-1">:</div>
                <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter tabular-nums leading-none text-[#000000]">{timeLeft.h.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mt-1">Hrs</span>
                </div>
                <div className="text-2xl font-black text-zinc-300 mb-1">:</div>
                <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter tabular-nums leading-none text-[#000000]">{timeLeft.m.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 mt-1">Mins</span>
                </div>
                <div className="text-2xl font-black text-zinc-300 mb-1">:</div>
                <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter tabular-nums text-yellow-600 leading-none">{timeLeft.s.toString().padStart(2, '0')}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 mt-1">Secs</span>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const { stats, loading } = useAdminStats();
    const [purchasesEnabled, setPurchasesEnabled] = useState(true);
    const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    const [isUpdatingFreeShipping, setIsUpdatingFreeShipping] = useState(false);
    const [upcomingDrops, setUpcomingDrops] = useState<Drop[]>([]);

    const fetchDrops = async () => {
        try {
            const res = await fetch("/api/admin/drops");
            const data: Drop[] = await res.json();
            const now = new Date();
            
            // Show all upcoming drops
            const futureDrops = data
                .filter(d => new Date(d.publishDate).getTime() > now.getTime())
                .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
            
            setUpcomingDrops(futureDrops);
        } catch (error) {
            console.error("Failed to fetch drops for dashboard", error);
        }
    };

    useEffect(() => {
        getStoreSettings().then(settings => {
            if (settings) {
                setPurchasesEnabled(settings.purchases_enabled ?? true);
                setFreeShippingEnabled(settings.free_shipping_enabled ?? false);
            }
        });
        fetchDrops();
    }, []);

    const handleTogglePurchases = async () => {
        if (purchasesEnabled) {
            // Open modal to confirm disabling
            setShowDisableModal(true);
        } else {
            // Enable directly
            setIsUpdatingSettings(true);
            try {
                const token = await auth.currentUser?.getIdToken();
                const result = await togglePurchaseStatus(true, token);
                if (result.success) {
                    setPurchasesEnabled(true);
                    toast.success("Store purchases enabled successfully");
                } else {
                    toast.error("Failed to enable purchases");
                }
            } catch (err) {
                console.error("Failed to enable purchases", err);
                toast.error("An error occurred while enabling purchases");
            } finally {
                setIsUpdatingSettings(false);
            }
        }
    };

    const handleToggleFreeShipping = async () => {
        setIsUpdatingFreeShipping(true);
        const newStatus = !freeShippingEnabled;
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await toggleFreeShippingStatus(newStatus, token);
            if (result.success) {
                setFreeShippingEnabled(newStatus);
                toast.success(`Free shipping coupon ${newStatus ? 'enabled' : 'disabled'}`);
            } else {
                toast.error("Failed to update free shipping status");
            }
        } catch (err) {
            console.error("Failed to toggle free shipping", err);
            toast.error("An error occurred");
        } finally {
            setIsUpdatingFreeShipping(false);
        }
    };

    const confirmDisable = async () => {
        if (confirmationText !== "STOP BUYING") return;

        setIsUpdatingSettings(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const result = await togglePurchaseStatus(false, token);
            if (result.success) {
                setPurchasesEnabled(false);
                setShowDisableModal(false);
                setConfirmationText("");
                toast.success("Store purchases disabled successfully");
            } else {
                toast.error("Failed to disable purchases");
            }
        } catch (err) {
            console.error("Failed to disable purchases", err);
            toast.error("Cloud synchronization failed");
        } finally {
            setIsUpdatingSettings(false);
        }
    };

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

    if (loading) return <AdminLoading message="Getting things ready..." />;

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 relative">
            <AdminPageHeader
                title="Dashboard"
                subtitle="Store overview and performance"
            >
                <div className="flex items-center gap-3 px-5 py-2.5 bg-black text-white rounded-full shadow-2xl shadow-black/20 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Store Online</span>
                </div>
            </AdminPageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {/* Upcoming Drops Pipeline - Horizontal Slider if 2+ */}
                {upcomingDrops.length > 0 && (
                    <div className="relative group/slider h-[200px]">
                        <div className="flex h-full gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mb-4">
                            {upcomingDrops.map((drop, idx) => (
                                <div key={drop.id} className="min-w-full h-full snap-center relative">
                                    <DropTimerCard drop={drop} onComplete={fetchDrops} />
                                    {upcomingDrops.length > 1 && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 opacity-20 group-hover/slider:opacity-100 transition-opacity">
                                            {idx < upcomingDrops.length - 1 && (
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
                        {upcomingDrops.length > 1 && (
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1 bg-zinc-50 rounded-full border border-zinc-100">
                                {upcomingDrops.map((_, i) => (
                                    <div key={i} className="w-1 h-1 rounded-full bg-zinc-400 opacity-30 last:mr-0 group-hover/slider:opacity-100" />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!upcomingDrops.length && (
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

                {/* Store Status Control */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 h-[200px] flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Store className="text-[#000000]" size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">System Infrastructure</span>
                            </div>
                            <h4 className="text-2xl font-black text-[#000000] tracking-tighter leading-none pt-1">Store Purchases</h4>
                        </div>
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            purchasesEnabled ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                            {purchasesEnabled ? <Unlock size={18} /> : <Lock size={18} />}
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <p className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-[0.1em] pr-4 leading-relaxed">
                            {purchasesEnabled ? "Active & Live" : "Paused for Maintenance"}
                        </p>
                        <button
                            onClick={handleTogglePurchases}
                            disabled={isUpdatingSettings}
                            className={cn(
                                "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                                purchasesEnabled
                                    ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-100",
                                isUpdatingSettings && "opacity-50 cursor-wait"
                            )}
                        >
                            {purchasesEnabled ? "Disable" : "Enable"}
                        </button>
                    </div>
                </div>

                {/* Free Shipping Control */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 h-[200px] flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Truck className="text-[#000000]" size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Global Logistics</span>
                            </div>
                            <h4 className="text-2xl font-black text-[#000000] tracking-tighter leading-none pt-1">Free Shipping</h4>
                        </div>
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            freeShippingEnabled ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-300"
                        )}>
                            <Truck size={18} />
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <p className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-[0.1em] pr-4 leading-relaxed">
                            {freeShippingEnabled ? "Premium Active" : "Ineligible / Off"}
                        </p>
                        <button
                            onClick={handleToggleFreeShipping}
                            disabled={isUpdatingFreeShipping}
                            className={cn(
                                "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                                freeShippingEnabled
                                    ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-100",
                                isUpdatingFreeShipping && "opacity-50 cursor-wait"
                            )}
                        >
                            {freeShippingEnabled ? "Disable" : "Enable"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
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
                        title="Recent Activity"
                        subtitle="Most recent orders and store updates"
                        icon={<Activity size={18} />}
                    >
                        <div className="space-y-6">
                            {stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order: { id: string; customer_details: { name: string }; amount: number; status: string; created_at: string }) => (
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
                                                <p className="text-sm font-black text-black group-hover/item:translate-x-1 transition-transform duration-500">{order.customer_details?.name || "Guest"}</p>
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
                                    <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">No Activity</h4>
                                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic leading-loose px-10">
                                        There is no recent activity to show.
                                    </p>
                                </div>
                            )}
                        </div>
                    </AdminCard>
                </div>

                {/* Top Products */}
                <div className="lg:col-span-2">
                    <AdminCard
                        title="Top Products"
                        subtitle="Best selling items this period"
                        icon={<ShoppingBag size={18} />}
                    >
                        <div className="space-y-4">
                            {stats.topProducts.length > 0 ? (
                                stats.topProducts.map((product: { name: string; sales: number; revenue: number }) => (
                                    <div key={product.name} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100/50 hover:bg-white hover:shadow-lg transition-all duration-300 group/item">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-[10px] font-black group-hover/item:scale-110 transition-transform">
                                                {product.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-black leading-tight">{product.name}</p>
                                                <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">{product.sales} Sales</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-black tracking-tight">₹{product.revenue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">No Data</p>
                                </div>
                            )}
                        </div>
                    </AdminCard>
                </div>

                {/* Performance Analytics (Chart) */}
                <div className="lg:col-span-3">
                    <div className="bg-black p-10 rounded-[3rem] shadow-2xl shadow-black/20 h-full flex flex-col justify-between group relative overflow-hidden border border-white/5">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                                    <BarChart3 size={22} />
                                    Sales Growth
                                </h3>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">LIVE</span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic mb-12">Monthly revenue overview</p>
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
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] font-aesthetic">Start</span>
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10"></div>)}
                            </div>
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] font-aesthetic">Current</span>
                        </div>

                        {/* Aesthetic Noise Overlay */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('/noise.png')]"></div>
                        {/* Interactive Glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
                    </div>
                </div>
            </div>

            {/* Disable Purchase Confirmation Modal */}
            {showDisableModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl shadow-black/20 border border-zinc-100 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <button
                                onClick={() => {
                                    setShowDisableModal(false);
                                    setConfirmationText("");
                                }}
                                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-zinc-400" />
                            </button>
                        </div>

                        <h3 className="text-xl font-black text-zinc-900 mb-2">Turn off purchases?</h3>
                        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                            This will stop customers from buying products. They will see a maintenance message.
                            This takes effect immediately.
                        </p>

                        <div className="space-y-4">
                            <p className="text-sm text-zinc-500 mb-4">
                                To confirm, please type <span className="font-bold text-black">STOP BUYING</span> below.
                            </p>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                placeholder="STOP BUYING"
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all mb-6"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDisableModal(false);
                                        setConfirmationText("");
                                    }}
                                    className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={confirmationText !== "STOP BUYING" || isUpdatingSettings}
                                    onClick={confirmDisable}
                                    className={cn(
                                        "flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                        confirmationText === "STOP BUYING"
                                            ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                                            : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                    )}
                                >
                                    {isUpdatingSettings ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Lock size={14} />
                                            Confirm Disable
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

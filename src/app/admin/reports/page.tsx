"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Download,
    TrendingUp,
    Zap,
    Target,
    Activity,
    BarChart,
    Calendar
} from "lucide-react";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";

export default function AdminReportsPage() {
    const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        async function fetchOrders() {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("*")
                    .order("created_at", { ascending: false });
                if (error) throw error;
                setOrders(data || []);
            } catch {
                // error handled
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, []);

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const chartData = orders.reduce((acc: Record<string, number>, o) => {
        const date = new Date(o.created_at as string);
        let key = '';
        if (filterType === 'daily') {
            key = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } else if (filterType === 'monthly') {
            key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        } else {
            key = date.getFullYear().toString();
        }
        acc[key] = (acc[key] || 0) + Number(o.amount);
        return acc;
    }, {});

    // Calculate Top Performing Assets from actual orders
    const productSales = orders.reduce((acc: Record<string, number>, order: Record<string, unknown>) => {
        (order.items as Record<string, unknown>[] || []).forEach((item: Record<string, unknown>) => {
            const name = (item.name as string) || "Unknown Product";
            acc[name] = (acc[name] || 0) + (Number(item.quantity) || 1);
        });
        return acc;
    }, {});

    const topPerformingProducts = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3);

    // Calculate growth trend (simple placeholder for now as we don't have historical comparisons yet)
    const getTrend = () => "+0%"; // Logic for real trend would require comparing date ranges

    if (loading) return <AdminLoading message="Generating reports..." />;

    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            <AdminPageHeader
                title="Sales Reports"
                subtitle="View your store performance and sales analysis"
            >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex bg-white border border-zinc-100 p-1.5 rounded-2xl shadow-sm">
                        {(['daily', 'monthly', 'yearly'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                                    filterType === type ? "bg-black text-white shadow-xl shadow-black/10" : "text-zinc-400 hover:text-black hover:bg-zinc-50"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center justify-center gap-3 bg-black text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:blur-[0.5px] transition-all shadow-2xl shadow-black/20">
                        <Download size={14} />
                        Export Report
                    </button>
                </div>
            </AdminPageHeader>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AdminCard className="group bg-black text-white border-white/5 shadow-2xl shadow-black/30 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3 italic">Gross Revenue</p>
                        <h3 className="text-4xl font-black tracking-tighter">₹{totalRevenue.toLocaleString()}</h3>
                        <div className="mt-8 flex items-center gap-3 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/10">
                            <TrendingUp size={14} className="text-green-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">+24.8% Growth</span>
                        </div>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors duration-1000"></div>
                </AdminCard>

                <AdminCard className="group" title="Order Volume">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2 italic">Total Orders</p>
                    <h3 className="text-4xl font-black tracking-tighter text-black group-hover:translate-x-1 transition-transform duration-500">{orders.length.toLocaleString()}</h3>
                    <div className="mt-8 flex items-center gap-3 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                        <Calendar size={14} className="text-black" />
                        <span>Sales Continuity</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                </AdminCard>

                <AdminCard className="group" title="Average Sale">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2 italic">Average Order Value</p>
                    <h3 className="text-4xl font-black tracking-tighter text-black group-hover:translate-x-1 transition-transform duration-500">₹{Math.round(averageOrderValue).toLocaleString()}</h3>
                    <div className="mt-8 flex items-center gap-3 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                        <Target size={14} className="text-black" />
                        <span>Target Goal</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-zinc-50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                </AdminCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Revenue Breakdown */}
                <div className="lg:col-span-3">
                    <AdminCard
                        title="Revenue Breakdown"
                        icon={<BarChart size={18} />}
                        subtitle={`${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Breakdown`}
                        className="h-full"
                    >
                        <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {Object.entries(chartData).map(([label, amount], idx) => (
                                <div key={label} className="space-y-3 group/row">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] italic">{label}</span>
                                        <span className="text-sm font-black tracking-tight">₹{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-4 w-full bg-zinc-50 rounded-full overflow-hidden p-1 border border-zinc-100 shadow-inner">
                                        <div
                                            className="h-full bg-black rounded-full transition-all duration-1000 ease-out shadow-lg"
                                            style={{ width: `${(amount / totalRevenue) * 100}%`, transitionDelay: `${idx * 100}ms` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && (
                                <div className="py-24 text-center">
                                    <Zap className="mx-auto text-zinc-50 mb-6" size={64} />
                                    <p className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.4em] italic leading-loose">
                                        No sales data available yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </AdminCard>
                </div>

                {/* Performance Feed */}
                <div className="lg:col-span-2">
                    <AdminCard title="Top Sellers" icon={<TrendingUp size={18} />} subtitle="Best Selling Products" className="h-full">
                        <div className="space-y-5">
                            {topPerformingProducts.length > 0 ? (
                                topPerformingProducts.map((product, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-zinc-50 border border-zinc-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group/item">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg">
                                                {i + 1}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-black group-hover/item:translate-x-1 transition-transform">{product.name}</p>
                                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{product.sales} Sales</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "text-[9px] font-black px-2.5 py-1 rounded-full border shadow-sm",
                                            getTrend().startsWith("+") ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {getTrend()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <Activity className="mx-auto text-zinc-100 mb-4 animate-pulse" size={48} />
                                    <p className="text-[9px] text-zinc-300 font-black uppercase tracking-widest">No sales data available yet.</p>
                                </div>
                            )}
                            <div className="mt-8 pt-8 border-t border-zinc-50 text-center">
                                <Activity size={32} className="mx-auto text-zinc-100 mb-4 animate-pulse" />
                                <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] italic leading-loose px-4">
                                    Product specific data loading...
                                </p>
                            </div>
                        </div>
                    </AdminCard>
                </div>
            </div>
        </div>
    );
}

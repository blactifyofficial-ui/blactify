"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    IndianRupee,
    TrendingUp,
    Calendar,
    Download,
    PieChart,
    BarChart
} from "lucide-react";

export default function AdminReportsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (err) {
                console.error("Error fetching for reports:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, []);

    // Simple analysis
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Group by month (simplified)
    const monthlyData = orders.reduce((acc: any, o) => {
        const month = new Date(o.created_at).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + Number(o.amount);
        return acc;
    }, {});

    return (
        <div className="space-y-8 pb-20 font-inter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales Report</h2>
                    <p className="text-zinc-500 text-sm font-medium italic">Detailed analysis of your store's financial performance.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-zinc-100 text-black px-6 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95">
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl shadow-black/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2">Total Gross Revenue</p>
                        <h3 className="text-4xl font-extrabold">₹{totalRevenue.toLocaleString()}</h3>
                        <div className="mt-6 flex items-center gap-2 text-zinc-400 text-xs font-medium italic">
                            <TrendingUp size={14} className="text-green-500" />
                            <span>+24% from last month</span>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-2 italic">Total Orders</p>
                    <h3 className="text-4xl font-extrabold text-black">{orders.length}</h3>
                    <div className="mt-6 flex items-center gap-2 text-zinc-400 text-xs font-medium italic">
                        <Calendar size={14} />
                        <span>Lifetime activity</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-2 italic">Avg. Order Value</p>
                    <h3 className="text-4xl font-extrabold text-black">₹{Math.round(averageOrderValue).toLocaleString()}</h3>
                    <div className="mt-6 flex items-center gap-2 text-zinc-400 text-xs font-medium italic">
                        <PieChart size={14} />
                        <span>Healthy conversion</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Breakdown */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BarChart size={20} />
                            Revenue Breakdown
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(monthlyData).map(([month, amount]: [string, any]) => (
                            <div key={month} className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold uppercase tracking-widest">
                                    <span className="text-zinc-400 italic">{month}</span>
                                    <span className="font-bold">₹{amount.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-black rounded-full transition-all duration-1000"
                                        style={{ width: `${(amount / totalRevenue) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <p className="text-center text-zinc-300 py-10 italic">Waiting for more data...</p>}
                    </div>
                </div>

                {/* Top Products Placeholder */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp size={20} />
                            Top Performing Products
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-xs font-bold">
                                        {i}
                                    </div>
                                    <p className="text-sm font-semibold italic">Product Analysis coming soon...</p>
                                </div>
                                <span className="text-xs font-bold text-zinc-400 text-right uppercase tracking-widest">0 Sales</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

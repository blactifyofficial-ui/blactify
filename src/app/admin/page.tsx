"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    IndianRupee,
    CreditCard
} from "lucide-react";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        recentOrders: [] as any[],
        popularProducts: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch Orders
                const { data: orders, error: ordersError } = await supabase
                    .from("orders")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (ordersError) throw ordersError;

                const revenue = orders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;

                setStats({
                    totalRevenue: revenue,
                    totalOrders: orders?.length || 0,
                    recentOrders: orders?.slice(0, 5) || [],
                    popularProducts: [] // Placeholder for now
                });
            } catch (err) {

            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { name: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, change: "+12.5%", trendingUp: true },
        { name: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, change: "+3.2%", trendingUp: true },
        { name: "Conversion Rate", value: "4.8%", icon: ArrowUpRight, change: "-0.5%", trendingUp: false },
        { name: "Active Users", value: "1,234", icon: Users, change: "+18%", trendingUp: true },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-inter">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-zinc-500 text-sm font-medium italic">Snapshot of your store performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                                <stat.icon className="text-black" size={20} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${stat.trendingUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                }`}>
                                {stat.trendingUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{stat.name}</p>
                        <h3 className="text-2xl font-extrabold mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Recent Orders</h3>
                        <button className="text-xs font-bold text-zinc-400 hover:text-black uppercase tracking-widest transition-colors">View All</button>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-50 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-50/50 rounded-2xl border border-transparent hover:border-zinc-100 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                                {order.customer_details?.name?.[0] || "#"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{order.customer_details?.name || "Guest"}</p>
                                                <p className="text-[10px] text-zinc-400 font-mono mt-0.5 font-normal">#{order.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-zinc-900">₹{order.amount}</p>
                                            <span className={`text-[10px] font-semibold uppercase tracking-widest ${order.status === 'paid' ? 'text-green-600' : 'text-zinc-400'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-400 text-center py-8 italic font-aesthetic">No orders found.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Sales Chart Placeholder */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-1">Sales Growth</h3>
                        <p className="text-xs text-zinc-400 font-medium">Monthly revenue performance</p>
                    </div>

                    <div className="h-64 mt-6 flex items-end justify-between gap-2">
                        {[40, 60, 45, 90, 65, 80, 50, 70, 85, 95, 75, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-zinc-100 rounded-t-lg relative group transition-all hover:bg-black">
                                <div
                                    className="absolute bottom-0 w-full bg-zinc-200 rounded-t-lg transition-all group-hover:bg-zinc-800"
                                    style={{ height: `${h}%` }}
                                ></div>
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded pointer-events-none transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase">Jan</span>
                        <span className="text-[10px] font-bold text-zinc-300 uppercase">Jun</span>
                        <span className="text-[10px] font-bold text-zinc-300 uppercase">Dec</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

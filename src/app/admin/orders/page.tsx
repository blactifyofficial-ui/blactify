"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
    Search,
    Filter,
    ChevronRight,
    ExternalLink,
    Calendar,
    Clock,
    ShoppingBag
} from "lucide-react";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_details?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'processing': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
            case 'failed': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
        }
    };

    return (
        <div className="space-y-8 font-inter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
                    <p className="text-zinc-500 text-sm font-medium italic">Manage and track your customer purchases.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-zinc-100 rounded-2xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-normal"
                    />
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-white rounded-3xl border border-zinc-100 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/admin/orders/${order.id}`}
                                className="group bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-colors">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-normal text-zinc-400">#{order.id.slice(0, 12)}</span>
                                            <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg mt-0.5">{order.customer_details?.name || "Guest User"}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-zinc-400">
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest">
                                                <Calendar size={12} />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest">
                                                <Clock size={12} />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-10">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="text-xl font-bold">₹{order.amount}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-100 group-hover:text-black transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="bg-white p-20 rounded-3xl border border-zinc-100 text-center">
                            <ShoppingBag className="mx-auto text-zinc-100 mb-4" size={64} />
                            <p className="text-zinc-500 text-sm font-medium italic">No orders found matching your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

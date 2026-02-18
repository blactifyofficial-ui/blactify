"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Search,
    ChevronRight,
    Calendar,
    Clock,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { AdminLoading, AdminPageHeader } from "@/components/admin/AdminUI";

export default function AdminOrdersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { orders, totalCount, loading } = useAdminOrders({
        page,
        pageSize,
        searchTerm
    });

    const totalPages = Math.ceil(totalCount / pageSize);

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
        <div className="space-y-8 font-inter animate-in fade-in duration-700">
            <AdminPageHeader
                title="Orders"
                subtitle="Manage and track customer orders"
            >
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-zinc-100 rounded-2xl w-full sm:w-80 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all text-sm font-medium placeholder:text-zinc-300 shadow-sm"
                    />
                </div>
            </AdminPageHeader>

            {loading ? (
                <AdminLoading message="Loading orders..." />
            ) : (
                <div className="grid gap-4">
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/admin/orders/${order.id}`}
                                className="group bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-2xl hover:border-black/5 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                            >
                                <div className="flex items-start gap-5 flex-1 relative z-10">
                                    <div className="w-16 h-16 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all duration-700 shadow-inner">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">
                                                ID: {order.id.slice(0, 12)}
                                            </span>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full border shadow-sm",
                                                getStatusColor(order.status)
                                            )}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-lg text-black tracking-tight group-hover:translate-x-1 transition-transform duration-500">
                                            {order.customer_details?.name || "Guest"}
                                        </h3>
                                        <div className="flex items-center gap-5 text-zinc-400">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-80 italic">
                                                <Calendar size={12} strokeWidth={2.5} />
                                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-80 italic">
                                                <Clock size={12} strokeWidth={2.5} />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-10 mt-6 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-zinc-50 relative z-10">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-1">TOTAL</p>
                                        <p className="text-2xl font-black tracking-tighter text-black">₹{order.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-black group-hover:text-white group-hover:scale-110 transition-all duration-700 border border-zinc-100 shadow-sm">
                                        <ChevronRight size={24} strokeWidth={3} />
                                    </div>
                                </div>

                                {/* Background glow effect */}
                                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-zinc-50 rounded-full blur-3xl group-hover:bg-zinc-100 transition-colors duration-700 opacity-50"></div>
                            </Link>
                        ))
                    ) : (
                        <div className="bg-white p-32 rounded-[3.5rem] border border-zinc-100 text-center shadow-inner relative overflow-hidden">
                            <ShoppingBag className="mx-auto text-zinc-100 mb-8 opacity-50" size={80} />
                            <h4 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-2">No Results</h4>
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic">No orders found.</p>
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none"></div>
                        </div>
                    )}

                    <div className="pt-8">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            className="mt-4"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

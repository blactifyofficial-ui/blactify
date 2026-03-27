"use client";

import Link from "next/link";
import { Activity, ShoppingBag } from "lucide-react";
import { AdminCard } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils";

interface Order {
    id: string;
    customer_details: { name: string };
    amount: number;
    status: string;
    created_at: string;
}

interface RecentActivityProps {
    orders: Order[];
}

export function RecentActivity({ orders }: RecentActivityProps) {
    return (
        <AdminCard
            title="Recent Activity"
            subtitle="Most recent orders and store updates"
            icon={<Activity size={18} />}
        >
            <div className="space-y-6">
                {orders.length > 0 ? (
                    orders.map((order) => (
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
    );
}

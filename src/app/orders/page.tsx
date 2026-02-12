"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { supabase } from "@/lib/supabase";
import { Package, ChevronLeft, Calendar, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
    name: string;
    quantity: number;
    price?: number;
    price_offer?: number;
    price_base?: number;
    image?: string;
    main_image?: string;
    size?: string;
}

interface Order {
    id: string;
    created_at: string;
    amount: number;
    currency: string;
    status: string;
    items: OrderItem[];
    payment_id: string;
}

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("user_id", user.uid)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (err) {
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && user) {
            fetchOrders();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center font-sans">
                <h1 className="font-empire text-3xl mb-4">Please Sign In</h1>
                <p className="text-zinc-500 mb-8">You need to be logged in to view your orders.</p>
                <Link href="/profile" className="bg-black text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white pb-20 pt-8 font-sans">
            <div className="px-6">
                <header className="mb-10">
                    <Link href="/profile" className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-6 text-xs font-bold uppercase tracking-widest">
                        <ChevronLeft size={16} />
                        Back to Profile
                    </Link>
                    <h1 className="font-empire text-5xl">Your Orders</h1>
                </header>

                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50 rounded-3xl border border-zinc-100">
                        <div className="mb-6 rounded-full bg-white p-6 shadow-sm">
                            <Package size={48} className="text-zinc-200" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">No orders found</h2>
                        <p className="text-zinc-500 mb-8 max-w-xs">Looks like you haven&apos;t made any purchases yet.</p>
                        <Link href="/shop" className="bg-black text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest">
                            Shop Now
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="group overflow-hidden rounded-3xl border border-zinc-100 bg-white transition-all hover:shadow-xl hover:shadow-zinc-100">
                                <div className="bg-zinc-50 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order ID</p>
                                        <p className="text-sm font-bold flex items-center gap-2">
                                            {order.id}
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter ${order.status === 'captured' ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-600'
                                                }`}>
                                                {order.status || 'Processing'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</p>
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Calendar size={14} className="text-zinc-400" />
                                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</p>
                                            <p className="text-lg font-bold">₹{order.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {Array.isArray(order.items) && order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-zinc-50 border border-zinc-100 flex-shrink-0">
                                                    {(item.image || item.main_image) && <Image src={(item.image || item.main_image)!} alt={item.name} fill className="object-cover" />}
                                                </div>
                                                <div className="flex-grow">
                                                    <h4 className="text-sm font-bold uppercase tracking-tight">{item.name}</h4>
                                                    <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                                                    {item.size && <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Size: {item.size}</p>}
                                                </div>
                                                <p className="text-sm font-bold">₹{(item.price || item.price_offer || item.price_base || 0).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {order.payment_id && (
                                        <div className="mt-8 flex items-center justify-between border-t border-zinc-50 pt-6">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                <CreditCard size={14} />
                                                Payment ID: {order.payment_id}
                                            </div>
                                            <button className="text-[10px] font-bold uppercase tracking-widest text-black hover:underline flex items-center gap-1">
                                                Receipt <ExternalLink size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

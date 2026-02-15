"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { supabase } from "@/lib/supabase";
import { Package, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import OrderCard from "./OrderCard";

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
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

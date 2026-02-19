"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/store/AuthContext";
import { getUserOrders } from "@/lib/order-sync";
import { createTicket } from "@/actions/support";
import { ChevronLeft, Send, CheckCircle2, AlertCircle, Phone, MessageSquare, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "order_related", label: "Order Related", icon: Package },
    { id: "general", label: "General Inquiry", icon: MessageSquare },
];

export default function SupportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        category: "order_related",
        orderId: "",
        phone: "",
        message: "",
    });

    useEffect(() => {
        async function fetchOrders() {
            if (!user) return;
            setOrdersLoading(true);
            try {
                const result = await getUserOrders(user.uid);
                if (result.success && result.orders) {
                    setOrders(result.orders);
                    if (result.orders.length > 0) {
                        setFormData(prev => ({ ...prev, orderId: result.orders![0].id }));
                    }
                } else if (!result.success) {
                    toast.error("We couldn't load your recent orders. You can still submit a general inquiry.");
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
                toast.error("There was a problem loading your orders. Please try refreshing.");
            } finally {
                setOrdersLoading(false);
            }
        }

        if (!authLoading && user) {
            fetchOrders();
        }
    }, [user, authLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please sign in to raise a ticket");
            return;
        }

        if (!formData.phone || !formData.message) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const result = await createTicket({
                userId: user.uid,
                orderId: formData.category === "order_related" ? formData.orderId : undefined,
                category: formData.category,
                phone: formData.phone,
                message: formData.message,
            });

            if (result.success) {
                setSubmitted(true);
                toast.success("Ticket raised successfully!");
            } else {
                // Showing the friendly error from the server action
                toast.error(result.error || "We couldn't process your request. Please try again.");
            }
        } catch (err) {
            toast.error("Something went wrong on our end. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center font-sans">
                <h1 className="font-empire text-3xl mb-4">Support Center</h1>
                <p className="text-zinc-500 mb-8">Please sign in to raise a support ticket.</p>
                <Link href="/profile" className="bg-black text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest">
                    Go to Login
                </Link>
            </div>
        );
    }

    if (submitted) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center px-6 font-sans">
                <div className="max-w-md w-full text-center py-20 bg-zinc-50 rounded-[40px] border border-zinc-100 p-8">
                    <div className="flex justify-center mb-8">
                        <div className="h-20 w-20 rounded-full bg-black flex items-center justify-center text-white scale-110 animate-bounce">
                            <CheckCircle2 size={40} />
                        </div>
                    </div>
                    <h1 className="font-empire text-4xl mb-6">Got it!</h1>
                    <p className="text-zinc-500 mb-10 leading-relaxed uppercase text-[11px] font-bold tracking-[0.2em]">
                        Your ticket has been raised. You will be reached out with email soon.
                    </p>
                    <Link href="/" className="inline-block bg-black text-white px-10 py-5 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">
                        Back to Home
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white pb-20 pt-8 font-sans">
            <div className="px-6 max-w-lg mx-auto">
                <header className="mb-10">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-6 text-xs font-bold uppercase tracking-widest">
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <h1 className="font-empire text-5xl">Support</h1>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-4">Raise a ticket and we&apos;ll get back to you</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Category Selection */}
                    <section>
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Select Category</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = formData.category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-3xl border transition-all text-left",
                                            isActive
                                                ? "border-black bg-black text-white shadow-xl scale-[1.02]"
                                                : "border-zinc-100 bg-zinc-50/50 text-zinc-500 hover:border-zinc-200"
                                        )}
                                    >
                                        <Icon size={20} />
                                        <span className="text-xs font-bold uppercase tracking-widest">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Order Selection (Conditional) */}
                    {formData.category === "order_related" && (
                        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Select Order</h2>
                            {ordersLoading ? (
                                <div className="h-14 bg-zinc-50 rounded-2xl animate-pulse" />
                            ) : orders.length > 0 ? (
                                <div className="relative">
                                    <select
                                        value={formData.orderId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-5 px-6 text-sm font-medium outline-none focus:border-black transition-colors appearance-none"
                                    >
                                        {orders.map((order) => (
                                            <option key={order.id} value={order.id}>
                                                Order #{order.id} (₹{order.amount})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                        <Package size={18} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4">
                                    <AlertCircle className="text-red-500" size={20} />
                                    <p className="text-[11px] font-bold uppercase tracking-tight text-red-600">No orders found for your account.</p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Contact Details */}
                    <section className="space-y-6">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Your Details</h2>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Your mobile number"
                                    className="w-full border-b border-zinc-200 py-4 pl-8 text-sm focus:border-black outline-none transition-colors bg-transparent"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">How can we help?</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-0 top-6 text-zinc-300" size={18} />
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Describe your issue or question..."
                                    className="w-full border-b border-zinc-200 py-4 pl-8 text-sm focus:border-black outline-none transition-colors bg-transparent resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={loading || (formData.category === "order_related" && orders.length === 0)}
                        className="w-full flex items-center justify-center gap-3 rounded-full bg-black py-6 text-xs font-bold uppercase tracking-widest text-white active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale hover:shadow-2xl shadow-black/20"
                    >
                        {loading ? "Raising Ticket..." : "Raise Support Ticket"}
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </main>
    );
}

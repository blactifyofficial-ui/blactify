"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Link as LinkIcon,
    Calendar,
    User,
    Phone,
    Mail,
    MapPin,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    CreditCard,
    Box
} from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = ["paid", "processing", "shipped", "delivered", "failed"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (err) {
                console.error("Error fetching order:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [id]);

    const handleUpdateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;
            setOrder({ ...order, status: newStatus });
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return CreditCard;
            case 'processing': return Clock;
            case 'shipped': return Truck;
            case 'delivered': return CheckCircle2;
            default: return Package;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-500">Order not found.</p>
                <Link href="/admin/orders" className="text-sm font-bold text-black mt-4 inline-block hover:underline">
                    Back to Orders
                </Link>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(order.status);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-inter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-full hover:bg-zinc-50 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-normal text-zinc-400">#{order.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Order Details</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={order.status}
                            disabled={updating}
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            className="appearance-none pl-12 pr-10 py-3 bg-white border border-zinc-100 rounded-2xl text-sm font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black/5 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <StatusIcon size={18} className="text-zinc-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Items & Address */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Items */}
                    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
                        <div className="bg-zinc-50/50 px-6 py-4 border-b border-zinc-100">
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Package size={16} />
                                Order Items ({order.items?.length || 0})
                            </h3>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {order.items?.map((item: any, index: number) => (
                                <div key={index} className="px-6 py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl overflow-hidden flex-shrink-0">
                                            {(item.main_image || item.imageUrl) ? (
                                                <img src={item.main_image || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                    <Box size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-base">{item.name}</h4>
                                            <p className="text-xs text-zinc-400 font-medium italic">Quantity: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">₹{item.price * item.quantity}</p>
                                        <p className="text-[10px] text-zinc-400 font-medium italic">₹{item.price} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-zinc-50/30 p-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 font-medium italic">Subtotal</span>
                                <span className="font-bold">₹{order.amount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 font-medium italic">Shipping</span>
                                <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">Free</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-zinc-100">
                                <span className="text-lg font-bold">Total Amount</span>
                                <span className="text-2xl font-extrabold">₹{order.amount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
                        <div className="bg-zinc-50/50 px-6 py-4 border-b border-zinc-100">
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={16} />
                                Shipping Address
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-lg font-bold mb-2">{order.customer_details?.name}</p>
                            <p className="text-zinc-500 text-sm font-medium italic leading-relaxed max-w-sm">
                                {order.shipping_address?.address},<br />
                                {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Customer & Payment Info */}
                <div className="space-y-8">
                    {/* Customer Info */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 italic">Customer Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                                    <User size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Name</p>
                                    <p className="text-sm font-bold truncate">{order.customer_details?.name || "Guest"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                                    <Phone size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Phone</p>
                                    <p className="text-sm font-bold">{order.customer_details?.phone || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                                    <Mail size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Email</p>
                                    <p className="text-sm font-bold truncate">{order.customer_details?.email || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 italic">Payment Details</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Razorpay Payment ID</p>
                                <p className="text-xs font-mono font-bold break-all bg-zinc-50 p-2 rounded-lg border border-zinc-100">{order.payment_id || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Creation Date</p>
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <Calendar size={14} className="text-zinc-400" />
                                    {new Date(order.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

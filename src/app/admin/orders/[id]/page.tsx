"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { getAdminOrderById, updateAdminOrder } from "@/app/actions/orders";
import { Order } from "@/types/database";
import {
    ArrowLeft,
    Clock,
    Package,
    User,
    Mail,
    Phone,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Truck,
    Calendar,
    CreditCard,
    Box,
    Activity,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminLoading, AdminPageHeader, AdminCard } from "@/components/admin/AdminUI";

const STATUS_SEQUENCE = ["paid", "processing", "shipped", "delivered"];
const STATUS_OPTIONS = ["paid", "processing", "shipped", "delivered", "failed"];

const getAvailableStatuses = (currentStatus: string) => {
    const status = currentStatus?.toLowerCase();
    if (status === "failed") return ["failed"];
    if (status === "delivered") return ["delivered"];
    const currentIndex = STATUS_SEQUENCE.indexOf(status);
    if (currentIndex === -1) return STATUS_OPTIONS;
    const available = [status];
    if (currentIndex < STATUS_SEQUENCE.length - 1) {
        available.push(STATUS_SEQUENCE[currentIndex + 1]);
    }
    if (status !== "delivered" && !available.includes("failed")) {
        available.push("failed");
    }
    return available;
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
    const [trackingId, setTrackingId] = useState("");
    const [itemMeasurements, setItemMeasurements] = useState<Record<string, Array<{ value: string; measurement_types: { name: string } }>>>({});

    useEffect(() => {
        async function fetchOrder() {
            try {
                const result = await getAdminOrderById(id);
                if (result.success && result.order) {
                    setOrder(result.order);
                    setTrackingId(result.order.tracking_id || "");
                } else {
                    throw new Error(result.error || "Order not found");
                }
            } catch {
                toast.error("Protocol Error", { description: "Failure to retrieve mission parameters." });
            } finally {
                setLoading(false);
            }
        }
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (!order?.items) return;
        async function fetchMeasurements() {
            // Note: If variant measurements are also blocked by RLS, we may need a server action for this as well.
            // For now, attempting to keep it simple as the main issue was orders access.
            try {
                const { supabase } = await import("@/lib/supabase");
                const measurementsMap: Record<string, Array<{ value: string; measurement_types: { name: string } }>> = {};
                if (!order?.items) return;
                for (const item of order.items) {
                    if (!item.id || !item.size) continue;
                    const key = `${item.id}-${item.size}`;
                    if (measurementsMap[key]) continue;
                    const { data: variant } = await supabase
                        .from('product_variants')
                        .select(`
                            id,
                            variant_measurements (
                                value,
                                measurement_types (
                                    name
                                )
                            )
                        `)
                        .eq('product_id', item.id)
                        .eq('size', item.size)
                        .maybeSingle();
                    if (variant?.variant_measurements) {
                        measurementsMap[key] = (variant.variant_measurements as unknown as { value: string; measurement_types: { name: string } | { name: string }[] }[]).map(m => ({
                            value: String(m.value),
                            measurement_types: (Array.isArray(m.measurement_types) ? m.measurement_types[0] : m.measurement_types) as { name: string }
                        }));
                    }
                }
                setItemMeasurements(measurementsMap);
            } catch { }
        }
        fetchMeasurements();
    }, [order]);

    const handleUpdateStatus = async (newStatus: string) => {
        if (!order) return;
        setStatusUpdating(true);
        const normalizedStatus = newStatus.toLowerCase();
        try {
            const result = await updateAdminOrder(id, { status: normalizedStatus });
            if (!result.success) throw new Error(result.error);

            toast.success("Status Synchronized", {
                description: `Vector updated to ${normalizedStatus.toUpperCase()}`,
            });
            setOrder({ ...order, status: normalizedStatus as Order['status'] });
        } catch {
            toast.error("Transmission Failed");
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleUpdateTracking = async () => {
        if (!order || (!trackingId.trim() && !order.tracking_id)) return;
        setStatusUpdating(true);
        try {
            const result = await updateAdminOrder(id, { tracking_id: trackingId });
            if (!result.success) throw new Error(result.error);

            toast.success("Logistics Updated", { description: "Tracking sequence finalized." });
            setOrder({ ...order, tracking_id: trackingId } as Order);
        } catch {
            toast.error("Process Failure");
        } finally {
            setStatusUpdating(false);
        }
    };

    const getStatusIcon = (status: string | undefined) => {
        switch (status?.toLowerCase()) {
            case 'paid': return CreditCard;
            case 'processing': return Clock;
            case 'shipped': return Truck;
            case 'delivered': return CheckCircle2;
            case 'failed': return Activity;
            default: return Package;
        }
    };

    if (loading) return <AdminLoading message="Accessing deployment detailed registry..." />;

    if (!order) {
        return (
            <div className="text-center py-32 font-inter">
                <AlertCircle className="mx-auto text-zinc-100 mb-6" size={64} />
                <h2 className="text-zinc-900 font-black uppercase tracking-[0.4em] text-sm mb-4">Registry Null</h2>
                <Link href="/admin/orders" className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-6 text-xs font-bold uppercase tracking-widest">
                    <ArrowLeft size={16} />
                    Back to Orders
                </Link>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(order.status);
    const itemsSubtotal = (order.items || []).reduce((acc: number, item) => {
        const price = (Number(item.price) || Number(item.price_offer) || Number(item.price_base) || 0);
        return acc + (price * Number(item.quantity));
    }, 0);
    const shippingCharge = order.amount - itemsSubtotal;

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20 font-inter max-w-6xl mx-auto">
            <AdminPageHeader
                title="Deployment Analysis"
                subtitle={`Registry Entry #${order.id.slice(0, 12)}...`}
            >
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select
                            value={order.status?.toLowerCase() || ""}
                            disabled={statusUpdating}
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            className="appearance-none pl-12 pr-10 py-3 bg-white border border-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all disabled:opacity-50 cursor-pointer shadow-sm min-w-[200px]"
                        >
                            {getAvailableStatuses(order.status).map(opt => (
                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <StatusIcon size={18} className={cn(
                                "transition-colors duration-300",
                                order.status?.toLowerCase() === 'failed' ? "text-red-500" : "text-black"
                            )} />
                        </div>
                    </div>
                </div>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <AdminCard title="Logistics Manifest" icon={<Package size={18} />} subtitle={`Total Assets: ${order.items?.length || 0}`}>
                        <div className="divide-y divide-zinc-50 -mx-8 -mb-8">
                            {(order.items || []).map((item, idx: number) => (
                                <div key={idx} className="px-8 py-8 flex items-center justify-between group hover:bg-zinc-50 transition-colors duration-500">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] overflow-hidden flex-shrink-0 relative shadow-inner">
                                            {(item.main_image || item.imageUrl) ? (
                                                <Image
                                                    src={item.main_image || item.imageUrl || ""}
                                                    alt={item.name}
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                                    <Box size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <h4 className="font-black text-lg tracking-tight">{item.name}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-white px-3 py-1 rounded-full border border-zinc-50">QTY: {item.quantity}</span>
                                                {item.size && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-900 bg-black/5 px-3 py-1 rounded-full italic">SIZE: {item.size}</span>
                                                )}
                                            </div>
                                            {item.size && itemMeasurements[`${item.id}-${item.size}`] && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {(itemMeasurements[`${item.id}-${item.size}`] || []).map((m, i) => (
                                                        <div key={i} className="px-2 py-1 bg-zinc-50 border border-black/5 rounded-lg flex flex-col items-start min-w-[70px] shadow-sm">
                                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-400">{m.measurement_types?.name}</span>
                                                            <span className="text-[10px] font-black text-black">{m.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-xl tracking-tighter">₹{((item.price || item.price_offer || item.price_base || 0) * item.quantity).toLocaleString()}</p>
                                        <p className="text-[9px] text-zinc-300 font-black uppercase tracking-widest italic">₹{(item.price || item.price_offer || item.price_base || 0).toLocaleString()} / UNIT</p>
                                    </div>
                                </div>
                            ))}
                            <div className="p-8 bg-zinc-50/50 space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                    <span>ASSETS SUB-TOTAL</span>
                                    <span className="text-zinc-900">₹{itemsSubtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                    <span>LOGISTICS SURCHARGE</span>
                                    <span className={cn(
                                        "font-black",
                                        shippingCharge > 0 ? "text-zinc-900" : "text-green-600 tracking-[0.4em]"
                                    )}>
                                        {shippingCharge > 0 ? `₹${shippingCharge.toLocaleString()}` : "FREE DEPLOYMENT"}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-6 border-t border-zinc-100">
                                    <span className="text-sm font-black uppercase tracking-[0.4em] text-zinc-900">MISSION VALUATION</span>
                                    <span className="text-3xl font-black tracking-tighter text-black">₹{order.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </AdminCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <AdminCard title="Deployment Vector" icon={<MapPin size={18} />}>
                            <div className="space-y-4">
                                <div className="p-5 bg-zinc-50 rounded-[2rem] border border-zinc-100 italic">
                                    <p className="text-lg font-black tracking-tight mb-3 text-black">{order.customer_details?.name}</p>
                                    <div className="space-y-1 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-loose">
                                        <p>{order.shipping_address?.address}{order.shipping_address?.apartment && <>, {order.shipping_address.apartment}</>}</p>
                                        <p>{order.shipping_address?.city}{order.shipping_address?.district && <>, {order.shipping_address.district}</>}</p>
                                        <p>{order.shipping_address?.state} — {order.shipping_address?.pincode}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 px-5 py-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                                        <Phone size={14} className="text-zinc-400" />
                                        <span className="text-xs font-black tracking-widest">{order.customer_details?.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </AdminCard>

                        <AdminCard title="Registry Tracking" icon={<Activity size={18} />}>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] italic mb-1.5 block">
                                        Asset Tracking ID
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={trackingId}
                                            onChange={(e) => setTrackingId(e.target.value)}
                                            placeholder="Paste Protocol ID..."
                                            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-black/5 transition-all placeholder:text-zinc-300"
                                        />
                                        <button
                                            onClick={handleUpdateTracking}
                                            disabled={statusUpdating || trackingId === (order.tracking_id || "")}
                                            className="px-6 py-3 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                                        >
                                            SYNC
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-zinc-300 font-black uppercase tracking-widest leading-tight">
                                        This ID will be broadcasted to the customer&apos;s secure interface upon reconciliation.
                                    </p>
                                </div>
                            </div>
                        </AdminCard>
                    </div>
                </div>

                <div className="space-y-10">
                    <AdminCard title="Identity Node" icon={<User size={18} />} subtitle="Verified Bio-data">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5 p-4 hover:bg-zinc-50 rounded-[1.5rem] transition-colors group">
                                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <User size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.3em]">Identity</p>
                                    <p className="text-sm font-black tracking-tight">{order.customer_details?.name || "GUEST PROTOCOL"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5 p-4 hover:bg-zinc-50 rounded-[1.5rem] transition-colors group">
                                <div className="w-12 h-12 bg-zinc-100 text-black rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all group-hover:scale-110">
                                    <Mail size={20} />
                                </div>
                                <div className="space-y-0.5 overflow-hidden">
                                    <p className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.3em]">Communication</p>
                                    <p className="text-[11px] font-black tracking-widest truncate">{order.customer_details?.email || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </AdminCard>

                    <AdminCard title="Fiscal Nexus" icon={<CreditCard size={18} />} subtitle="Transaction Telemetry">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.3em]">Fiscal Hash</p>
                                <p className="text-[10px] font-mono font-black break-all bg-zinc-50 p-4 rounded-2xl border border-zinc-100 shadow-inner italic">
                                    {order.payment_id || "GATEWAY_NULL"}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-zinc-50 flex items-center gap-4">
                                <Calendar size={16} className="text-zinc-400" />
                                <div className="space-y-0.5">
                                    <p className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.3em]">Deployment Epoch</p>
                                    <p className="text-xs font-black tracking-widest">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </AdminCard>
                </div>
            </div>
        </div>
    );
}

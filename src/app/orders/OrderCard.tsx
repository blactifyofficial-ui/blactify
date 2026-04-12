"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Calendar, CreditCard, ExternalLink, MapPin, Truck, Copy, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OrderItem {
    name: string;
    quantity: number;
    price?: number;
    price_offer?: number;
    price_base?: number;
    image?: string;
    main_image?: string;
    product_images?: { url: string }[];
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
    tracking_id?: string;
    shipping_address?: {
        address?: string;
        line1?: string;
        apartment?: string;
        line2?: string;
        city?: string;
        district?: string;
        state?: string;
        pincode?: string;
        postal_code?: string;
    };
}

interface OrderCardProps {
    order: Order;
}

interface DelhiveryStatus {
    status: string;
    statusType: string;
    location: string;
    timestamp: string;
    activity: string;
}

function parseDelhiveryStatus(data: Record<string, unknown>): DelhiveryStatus | null {
    try {
        const shipment = data?.Shipment as Record<string, unknown> | undefined;
        const statusObj = shipment?.Status as Record<string, unknown> | undefined;
        if (!statusObj) return null;
        return {
            status: String(statusObj.Status || "Unknown"),
            statusType: String(statusObj.StatusType || ""),
            location: String(statusObj.StatusLocation || ""),
            timestamp: String(statusObj.StatusDateTime || ""),
            activity: String(statusObj.Instructions || statusObj.Status || ""),
        };
    } catch {
        return null;
    }
}

function getStatusDisplay(ds: DelhiveryStatus | null, orderStatus: string) {
    if (!ds) {
        // Fallback to order status
        const label = orderStatus === 'captured' || orderStatus === 'paid' ? 'Confirmed' :
            orderStatus === 'processing' ? 'Processing' :
            orderStatus === 'shipped' ? 'Shipped' :
            orderStatus === 'delivered' ? 'Delivered' :
            orderStatus || 'Pending';
        return { label, color: 'bg-zinc-200 text-zinc-700' };
    }

    const s = ds.status.toLowerCase();
    const st = ds.statusType.toUpperCase();

    if (st === 'DL' || s.includes('delivered')) return { label: 'Delivered', color: 'bg-green-100 text-green-700' };
    if (s.includes('out for delivery')) return { label: 'Out for Delivery', color: 'bg-blue-100 text-blue-700' };
    if (s.includes('in transit')) return { label: 'In Transit', color: 'bg-black text-white' };
    if (s.includes('picked up')) return { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-700' };
    if (s.includes('dispatched')) return { label: 'Dispatched', color: 'bg-black text-white' };
    if (s.includes('manifest') || s.includes('registered') || s.includes('pickup')) return { label: 'Registered', color: 'bg-amber-100 text-amber-700' };
    if (s.includes('rto') || s.includes('return')) return { label: 'Returned', color: 'bg-red-100 text-red-700' };
    if (st === 'UD') return { label: 'In Transit', color: 'bg-black text-white' }; // Catch-all for most movement
    if (s.includes('pending')) return { label: 'Pending', color: 'bg-zinc-200 text-zinc-700' };

    return { label: ds.status, color: 'bg-zinc-200 text-zinc-700' };
}

export default function OrderCard({ order }: OrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [delhiveryStatus, setDelhiveryStatus] = useState<DelhiveryStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusFetched, setStatusFetched] = useState(false);

    const fetchDelhiveryStatus = useCallback(async () => {
        if (!order.tracking_id || statusFetched) return;
        setStatusLoading(true);
        try {
            const res = await fetch(`/api/shipping/track/${order.tracking_id}`);
            if (res.ok) {
                const data = await res.json();
                const parsed = parseDelhiveryStatus(data);
                if (parsed) setDelhiveryStatus(parsed);
            }
        } catch {
            // Silently fail — fallback to order status
        } finally {
            setStatusLoading(false);
            setStatusFetched(true);
        }
    }, [order.tracking_id, statusFetched]);

    useEffect(() => {
        if (isExpanded && order.tracking_id && !statusFetched) {
            fetchDelhiveryStatus();
        }
    }, [isExpanded, order.tracking_id, statusFetched, fetchDelhiveryStatus]);

    return (
        <div className="group overflow-hidden rounded-3xl border border-zinc-100 bg-white transition-all hover:shadow-xl hover:shadow-zinc-100">
            {/* Header - Always Visible */}
            <div
                className="bg-zinc-50 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order ID</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                        {order.id}
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            order.status === 'captured' || order.status === 'paid' ? 'bg-zinc-200 text-zinc-800' : 
                            order.status === 'unpaid' || order.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'
                        )}>
                            {order.status === 'captured' || order.status === 'paid' ? 'PAID' : 
                             order.status === 'unpaid' ? 'UNPAID' : (order.status || 'Processing')}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
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
                    <div className="space-y-1 text-right min-w-[80px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</p>
                        <p className="text-lg font-medium">₹{order.amount.toLocaleString()}</p>
                    </div>

                    {/* Toggle Arrow */}
                    <div className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 transition-transform duration-300 ml-2",
                        isExpanded && "rotate-180 bg-black border-black text-white"
                    )}>
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>

            {/* Collapsible Content */}
            <div className={cn(
                "grid transition-all duration-300 ease-in-out",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="overflow-hidden">
                    <div className="p-6">
                        <div className="space-y-4">
                            {Array.isArray(order.items) && order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-zinc-50 border border-zinc-100 flex-shrink-0">
                                        {(item.image || item.main_image || item.product_images?.[0]?.url) && (
                                            <Image
                                                src={(item.image || item.main_image || item.product_images?.[0]?.url)!}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-medium uppercase tracking-tight">{item.name}</h4>
                                        <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                                        {item.size && <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Size: {item.size}</p>}
                                    </div>
                                    <p className="text-sm font-medium">₹{(item.price || item.price_offer || item.price_base || 0).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        {order.payment_id && (
                            <div className="flex flex-col gap-4 w-full">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                        <CreditCard size={14} />
                                        Payment ID: {order.payment_id}
                                    </div>
                                    <Link
                                        href={`/invoice/${order.id}`}
                                        className="text-[10px] font-bold uppercase tracking-widest text-black hover:underline flex items-center gap-1 group/btn"
                                    >
                                        Receipt <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>

                                {order.tracking_id ? (
                                    <div className="flex flex-col gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Tracking ID (AWB)</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(order.tracking_id!);
                                                    }}
                                                    title="Copy AWB to clipboard"
                                                    className="text-sm font-mono font-bold tracking-tight hover:text-zinc-500 transition-colors cursor-copy flex items-center gap-1.5"
                                                >
                                                    {order.tracking_id}
                                                    <Copy size={12} className="text-zinc-300" />
                                                </button>
                                            </div>
                                            {statusLoading ? (
                                                <div className="px-3 py-1.5 bg-zinc-100 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    Checking
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full",
                                                    getStatusDisplay(delhiveryStatus, order.status).color
                                                )}>
                                                    {getStatusDisplay(delhiveryStatus, order.status).label}
                                                </div>
                                            )}
                                        </div>


                                        <a
                                            href="https://www.delhivery.com/tracking"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.98]"
                                        >
                                            <Truck size={14} />
                                            Track Shipment
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Tracking Information</p>
                                            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">Tracking ID not provided yet</p>
                                        </div>
                                    </div>
                                )}

                                {order.shipping_address && (
                                    <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 relative overflow-hidden group/addr mt-2">
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-zinc-100 group-hover/addr:bg-black group-hover/addr:text-white transition-colors">
                                                    <MapPin size={14} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Delivery Address</span>
                                            </div>
                                            
                                            <div className="space-y-1 pl-10">
                                                <p className="text-sm font-black tracking-tight text-black">
                                                    {order.shipping_address.address || order.shipping_address.line1}
                                                    {(order.shipping_address.apartment || order.shipping_address.line2) && (
                                                        <span className="text-zinc-400">, {order.shipping_address.apartment || order.shipping_address.line2}</span>
                                                    )}
                                                </p>
                                                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    {order.shipping_address.city}{order.shipping_address.district && <>, {order.shipping_address.district}</>}
                                                </p>
                                                <p className="text-[11px] font-black tracking-widest text-black/80">
                                                    {order.shipping_address.state} — <span className="bg-white px-2 py-0.5 border border-zinc-100 rounded tracking-widest">{order.shipping_address.pincode || order.shipping_address.postal_code}</span>
                                                </p>
                                                
                                                <div className="pt-4 mt-4 border-t border-zinc-100/50">
                                                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">Standardized Format: [STREET], [AREA], [CITY], [STATE] - [PINCODE]</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

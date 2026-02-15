"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Calendar, CreditCard, ExternalLink } from "lucide-react";
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
}

interface OrderCardProps {
    order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

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
                            order.status === 'captured' || order.status === 'paid' ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-100 text-zinc-500'
                        )}>
                            {order.status === 'captured' || order.status === 'paid' ? 'PAID' : (order.status || 'Processing')}
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
                            <div className="mt-8 flex items-center justify-between border-t border-zinc-50 pt-6">
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

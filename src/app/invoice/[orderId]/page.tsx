"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOrder } from "@/lib/order-sync";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface OrderDetail {
    id: string;
    created_at: string;
    amount: number;
    currency: string;
    status: string;
    items: {
        id: string;
        name: string;
        quantity: number;
        price: number; // Simplified, assuming processed price
        price_base?: number;
        price_offer?: number;
        image?: string;
        main_image?: string;
        product_images?: { url: string }[];
        size?: string;
    }[];
    customer_details: {
        name: string;
        email: string;
        phone: string;
        secondary_phone?: string;
    };
    shipping_address: {
        address: string;
        apartment?: string;
        city: string;
        district: string;
        state: string;
        pincode: string;
    };
    payment_id?: string;
}

export default function InvoicePage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;

        async function fetchOrder() {
            try {
                const result = await getOrder(orderId);

                if (result.success && result.order) {
                    setOrder(result.order as unknown as OrderDetail);
                } else {
                    console.error("Failed to fetch order:", result.error);
                }
            } catch (err) {
                console.error("Error in fetchOrder:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [orderId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
                <Link href="/orders" className="text-zinc-500 hover:text-black hover:underline">
                    Back to Orders
                </Link>
            </div>
        );
    }

    const subtotal = order.items.reduce((acc, item) => {
        const price = item.price || item.price_offer || item.price_base || 0;
        return acc + price * item.quantity;
    }, 0);

    const calculatedShipping = subtotal < 2999 ? 59 : 0;
    const expectedTotal = subtotal + calculatedShipping;
    const discount = expectedTotal - order.amount;

    // Use the actual paid amount as total
    const total = order.amount;

    return (
        <div className="min-h-screen bg-white text-black font-sans p-4 md:p-16 print:p-0">
            {/* Non-printing navigation */}
            <div className="mb-8 flex justify-between items-center print:hidden">
                <Link href="/orders" className="flex items-center gap-2 text-zinc-500 hover:text-black text-sm uppercase tracking-wide font-medium">
                    <ArrowLeft size={16} /> Back to Orders
                </Link>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                >
                    <Printer size={16} /> Print / Download
                </button>
            </div>

            {/* Invoice Container */}
            <div className="max-w-3xl mx-auto border border-zinc-100 rounded-none bg-white p-6 md:p-12 print:border-none print:shadow-none print:p-0 print:max-w-none">

                {/* Header */}
                <div className="flex justify-between items-start mb-16 border-b border-zinc-100 pb-8 break-inside-avoid">
                    <div className="flex flex-col items-start gap-4">
                        <div className="relative w-16 h-16">
                            <Image
                                src="/welcome-eye.png"
                                alt="Blactify Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-heading font-bold uppercase tracking-tight">Blactify</h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Keep it blactify</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-light text-zinc-200 uppercase tracking-widest mb-2">Invoice</h2>
                        <p className="font-mono text-xs text-zinc-500">#{order.id.toUpperCase()}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                            {new Date(order.created_at).toLocaleDateString("en-US", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                        {order.status === 'paid' || order.status === 'captured' ? (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-zinc-200">
                                Paid
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-16 break-inside-avoid">
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Bill To</h3>
                        <p className="font-bold text-sm mb-1">{order.customer_details.name}</p>
                        <p className="text-zinc-600 text-sm whitespace-pre-wrap">{[
                            order.shipping_address.apartment,
                            order.shipping_address.address,
                            order.shipping_address.city,
                            order.shipping_address.district,
                            order.shipping_address.state,
                            order.shipping_address.pincode
                        ].filter(Boolean).join("\n")}</p>
                        <p className="text-zinc-500 text-xs mt-2">{order.customer_details.email}</p>
                        <p className="text-zinc-500 text-xs">{order.customer_details.phone}</p>
                        {order.customer_details.secondary_phone && (
                            <p className="text-zinc-500 text-xs">Alt: {order.customer_details.secondary_phone}</p>
                        )}
                    </div>
                    <div className="md:text-right">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Payment Details</h3>
                        <div className="space-y-1 inline-flex flex-col md:items-end w-full">
                            <div className="flex justify-between md:justify-end gap-4 text-sm">
                                <span className="text-zinc-500">Method</span>
                                <span className="font-medium">Online Payment</span>
                            </div>
                            {order.payment_id && (
                                <div className="flex justify-between md:justify-end gap-4 text-sm">
                                    <span className="text-zinc-500">Transaction ID</span>
                                    <span className="font-mono text-xs">{order.payment_id}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="mb-12">
                    {/* Desktop Table View */}
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="border-b-2 border-zinc-900">
                                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 w-1/2">Item Description</th>
                                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">Qty</th>
                                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-right">Price</th>
                                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {order.items.map((item, idx) => {
                                const price = item.price || item.price_offer || item.price_base || 0;
                                return (
                                    <tr key={idx} className="group">
                                        <td className="py-6 pr-4">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-10 h-10 relative bg-zinc-50 hidden print:block border border-zinc-100 flex-shrink-0">
                                                    {(item.image || item.main_image || item.product_images?.[0]?.url) && (
                                                        <Image
                                                            src={(item.image || item.main_image || item.product_images?.[0]?.url)!}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover grayscale opacity-80"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-zinc-900">{item.name}</p>
                                                    {item.size && <p className="text-[10px] text-zinc-500 uppercase mt-0.5">Size: {item.size}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center text-sm font-mono text-zinc-600">{item.quantity}</td>
                                        <td className="py-6 text-right text-sm font-mono text-zinc-600">₹{price.toLocaleString()}</td>
                                        <td className="py-6 text-right text-sm font-medium">₹{(price * item.quantity).toLocaleString()}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {/* Mobile List View */}
                    <div className="md:hidden space-y-6 divide-y divide-zinc-100 border-t border-b border-zinc-100 py-6 print:hidden">
                        {order.items.map((item, idx) => {
                            const price = item.price || item.price_offer || item.price_base || 0;
                            return (
                                <div key={idx} className={cn("pt-6 first:pt-0 pb-6 last:pb-0")}>
                                    <div className="flex gap-4 mb-3">
                                        <div className="w-16 h-20 relative bg-zinc-50 border border-zinc-100 flex-shrink-0">
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
                                            {item.size && <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Size: {item.size}</p>}
                                            <div className="mt-2 flex justify-between items-center text-xs">
                                                <span className="text-zinc-500 font-mono">₹{price.toLocaleString()} × {item.quantity}</span>
                                                <span className="font-bold">₹{(price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Simple Footer/Totals (Always visible, styled for mobile too) */}
                    <div className="mt-8 space-y-3">
                        <div className="flex justify-between md:justify-end md:gap-12 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            <span>Subtotal</span>
                            <span className="text-zinc-900 md:w-32 md:text-right">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between md:justify-end md:gap-12 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            <span>Shipping</span>
                            <span className="text-zinc-900 md:w-32 md:text-right">{calculatedShipping > 0 ? `₹${calculatedShipping.toLocaleString()}` : 'FREE'}</span>
                        </div>
                        {discount > 1 && (
                            <div className="flex justify-between md:justify-end md:gap-12 text-[10px] font-bold uppercase tracking-widest text-green-600">
                                <span>Welcome Offer</span>
                                <span className="md:w-32 md:text-right">-₹{Math.round(discount).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between md:justify-end md:gap-12 pt-4 border-t border-zinc-100">
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Total</span>
                            <span className="text-xl font-bold md:w-32 md:text-right">₹{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-20 pt-12 border-t border-zinc-100 text-center print:break-inside-avoid">
                    <p className="font-heading text-lg font-bold uppercase tracking-tight mb-2">Thank you for your business</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-[0.3em]">Keep it blactify</p>

                    <div className="mt-12 text-[10px] text-zinc-300 flex justify-center gap-8 uppercase tracking-widest">
                        <span>blactify.com</span>
                        <span>support@blactify.com</span>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 10mm; size: auto; }
                    body { 
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        overflow: visible !important;
                        position: static !important;
                    }
                    /* Force hide fixed UI elements */
                    header, nav, footer, 
                    .z-[50], .z-[60], .z-[70], .z-[80], 
                    [data-sonner-toaster],
                    .fixed, .sticky { 
                        display: none !important; 
                        opacity: 0 !important;
                        pointer-events: none !important;
                    } 
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:break-inside-avoid { break-inside: avoid; }
                    
                    /* Ensure table and list show appropriately in print */
                    .md\\:table { display: table !important; width: 100% !important; }
                    .md\\:hidden { display: none !important; }
                }
            `}</style>
        </div >
    );
}

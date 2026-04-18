"use client";

import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

interface OrderDetail {
    id: string;
    amount: number;
    tracking_id?: string;
    items: {
        id: string;
        name: string;
        quantity: number;
        price_base: number;
        price_offer?: number;
        main_image?: string;
        product_images?: { url: string }[];
        size?: string;
    }[];
    customer_details: {
        name: string;
        email: string;
        phone: string;
    };
    shipping_address: {
        address: string;
        apartment?: string;
        city: string;
        district: string;
        state: string;
        pincode: string;
    };
}

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order_id");
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notified, setNotified] = useState(false);

    useEffect(() => {
        const duration = 1.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 20, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: NodeJS.Timeout = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 30 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function fetchOrderAndNotify() {
            if (!orderId || notified) {
                setLoading(false);
                return;
            }

            try {
                // Use Server Action to fetch order (bypasses RLS issues)
                const { getOrder } = await import("@/lib/order-sync");
                const token = await auth.currentUser?.getIdToken();
                const result = await getOrder(orderId, token);

                if (!result.success || !result.order) {
                    throw new Error(result.error || "Order not found");
                }

                const data = result.order;
                setOrder(data);

                // Done
                setNotified(true);

            } catch (error) {
                console.error("Error fetching order details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrderAndNotify();
    }, [orderId, notified]);

    const [countdown, setCountdown] = useState(20);
    const router = useRouter();

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            router.push("/");
        }
    }, [countdown, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
                <div className="w-12 h-12 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium animate-pulse">Confirming your order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="text-red-500 opacity-20" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Order Not Found</h1>
                <p className="text-zinc-500 mb-8 max-w-sm">We couldn&apos;t retrieve the details for this order, but don&apos;t worry—your purchase is safe.</p>
                <Link href="/" className="px-8 py-3 bg-black text-white rounded-md font-medium">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="max-w-4xl w-full flex flex-col items-center text-center -mt-10">
                <div className="relative w-32 h-32 mb-8 animate-in zoom-in-50 duration-700">
                    <Image
                        src="/welcome-eye.png"
                        alt="Success"
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="flex items-center gap-3 text-green-600 font-bold uppercase tracking-widest text-[10px] mb-4">
                    <CheckCircle2 size={16} />
                    Order Confirmed
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold text-zinc-900 mb-2 uppercase tracking-tight">Thank You.</h1>
                <p className="text-zinc-400 font-medium uppercase tracking-[0.3em] text-[10px] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                    Keep it blactify
                </p>
                <p className="text-zinc-500 max-w-md mx-auto text-sm md:text-base leading-relaxed">
                    Order <span className="font-mono text-zinc-900">#{order.id.slice(0, 12)}</span> is being processed.
                </p>
                {order.tracking_id && (
                    <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex flex-col items-center animate-in fade-in slide-in-from-bottom-3 duration-1000 delay-300">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Tracking Generated (Delhivery)</span>
                        <a 
                            href={`https://track.delhivery.com/tracking/track?id=${order.tracking_id}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                        >
                            {order.tracking_id}
                        </a>
                    </div>
                )}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                    <Link
                        href="/"
                        className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded transition-all hover:bg-zinc-800"
                    >
                        Continue Shopping
                    </Link>
                    <p className="text-zinc-400 text-[10px] flex items-center justify-center">
                        Redirecting in {countdown}s
                    </p>
                </div>
            </div>
        </div>
    );
}


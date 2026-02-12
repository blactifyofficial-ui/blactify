"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface OrderDetail {
    id: string;
    amount: number;
    items: { name: string; quantity: number }[];
    customer_details: {
        name: string;
        phone: string;
    };
    shipping_address: {
        address: string;
        city: string;
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
                const { data, error } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("id", orderId)
                    .single();

                if (error) throw error;
                setOrder(data);

                // Start Automation
                setNotified(true);

                // Trigger Server-side Notifications (Email & WhatsApp)
                await fetch("/api/notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order: data }),
                });

            } catch (err) {
                console.error("Error in fetchOrderAndNotify:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrderAndNotify();
    }, [orderId, notified]);

    const [countdown, setCountdown] = useState(5);
    const router = useRouter();

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            router.push("/");
        }
    }, [countdown, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-zinc-500 mb-8 max-w-md">
                Thank you for your purchase. We have received your order and automated notifications have been sent to the seller.
            </p>
            <p className="text-zinc-400 text-xs mb-8">
                Redirecting to home in {countdown}s...
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                    href="/"
                    className="px-8 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                >
                    Return Home Now
                </Link>
            </div>

            {loading ? (
                <p className="text-zinc-400 text-sm italic">Retrieving order details...</p>
            ) : order && (
                <div className="text-left w-full max-w-md p-6 border border-zinc-100 rounded-xl bg-zinc-50/50">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Order ID</span>
                            <span className="font-mono text-xs">#{order.id}</span>
                        </div>
                        <div className="flex justify-between font-bold text-zinc-900 pt-2 border-t border-zinc-200 mt-2">
                            <span>Amount Paid</span>
                            <span>₹{order.amount}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

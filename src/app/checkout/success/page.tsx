"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {

    useEffect(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: NodeJS.Timeout = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-zinc-500 mb-8 max-w-md">
                Thank you for your purchase. We have received your order and will begin processing it shortly.
            </p>
            <Link
                href="/shop"
                className="px-8 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
            >
                Continue Shopping
            </Link>
        </div>
    );
}

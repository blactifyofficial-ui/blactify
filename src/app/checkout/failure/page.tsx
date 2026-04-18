"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailureContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDirect = searchParams.get("direct") === "true";
    const tryAgainUrl = isDirect ? "/checkout?direct=true" : "/checkout";

    const handleCleanupAndNavigate = (path: string) => {
        sessionStorage.removeItem("checkout-form-data");
        sessionStorage.removeItem("direct-checkout-item");
        router.push(path);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12 md:p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shrink-0">
                <XCircle className="text-red-600" size={32} />
            </div>
            <h1 className="text-lg md:text-3xl font-bold text-zinc-900 mb-2 !leading-tight uppercase font-heading">Payment Failed</h1>
            <p className="text-zinc-500 mb-8 max-w-md text-sm md:text-base">
                We couldn&apos;t process your payment. Please try again or use a different payment method.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none justify-center">
                <Link
                    href={tryAgainUrl}
                    className="w-full sm:w-auto px-10 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center"
                >
                    Try Again
                </Link>
                <button
                    onClick={() => handleCleanupAndNavigate("/shop?openCart=true")}
                    className="w-full sm:w-auto px-10 py-4 border border-zinc-200 text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all active:scale-95 flex items-center justify-center"
                >
                    Return to Bag
                </button>
                <button
                    onClick={() => handleCleanupAndNavigate("/")}
                    className="w-full sm:w-auto px-10 py-4 border border-zinc-200 text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all active:scale-95 flex items-center justify-center"
                >
                    Return to Home
                </button>
            </div>
        </div>
    );
}

export default function CheckoutFailurePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <FailureContent />
        </Suspense>
    );
}

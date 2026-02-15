import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CheckoutFailurePage() {
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
                    href="/checkout"
                    className="w-full sm:w-auto px-8 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                >
                    Try Again
                </Link>
                <Link
                    href="/cart"
                    className="w-full sm:w-auto px-8 py-3 border border-zinc-200 text-zinc-900 text-sm font-medium rounded-md hover:bg-zinc-50 transition-colors"
                >
                    Return to Cart
                </Link>
            </div>
        </div>
    );
}

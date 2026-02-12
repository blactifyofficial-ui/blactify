import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CheckoutFailurePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Payment Failed</h1>
            <p className="text-zinc-500 mb-8 max-w-md">
                We couldn&apos;t process your payment. Please try again or use a different payment method.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/checkout"
                    className="px-8 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                >
                    Try Again
                </Link>
                <Link
                    href="/cart"
                    className="px-8 py-3 border border-zinc-200 text-zinc-900 text-sm font-medium rounded-md hover:bg-zinc-50 transition-colors"
                >
                    Return to Cart
                </Link>
            </div>
        </div>
    );
}

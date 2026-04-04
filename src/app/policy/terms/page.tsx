export const preferredRegion = "sin1";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-white pb-24 pt-8 font-sans">
            <div className="mx-auto max-w-3xl px-6">
                <header className="mb-12">
                    <Link href="/" className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
                        <ChevronLeft size={14} />
                        Back to Home
                    </Link>
                    <h1 className="font-empire text-5xl md:text-6xl text-black">Terms of Service</h1>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Last Updated: February 2026</p>
                </header>

                <div className="prose prose-zinc prose-sm max-w-none space-y-12 text-zinc-600 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-black">Agreement</h2>
                        <p>
                            By accessing and using this website, you agree to comply with and be bound by the following terms and conditions of use.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-black">Ordering & Payment</h2>
                        <p>
                            All orders are subject to availability and confirmation of the order price. We reserve the right to refuse any order you place with us. Payments must be made via our approved methods (Razorpay).
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-black">Intellectual Property</h2>
                        <p>
                            The content of the pages of this website is for your general information and use only. It is subject to change without notice. All trademarks reproduced in this website are the property of Blactify.
                        </p>
                    </section>

                    <section className="space-y-4 border-t border-zinc-100 pt-12">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-black">Return & Cancellation Policy</h2>
                        <p className="font-medium text-red-600">
                            Please note that we currently do not offer any standard return or cancellation policy. Once an order is placed and confirmed, it cannot be cancelled or returned. 
                        </p>
                        <p>
                            However, we understand that exceptional circumstances may occur. If you believe you have a genuine case (e.g., received a damaged or incorrect product), you may raise a <Link href="/support" className="text-black font-medium underline">support ticket</Link>. Each case will be reviewed individually at our discretion.
                        </p>
                    </section>

                    <section className="space-y-4 border-t border-zinc-100 pt-12">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-black">Limitation of Liability</h2>
                        <p>
                            Blactify shall not be liable for any special or consequential damages that result from the use of, or the inability to use, the materials on this site or the performance of the products.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-black">Governing Law</h2>
                        <p>
                            Your use of this website and any dispute arising out of such use is subject to the laws of India.
                        </p>
                    </section>
                    <section className="space-y-4 pt-12 border-t border-zinc-100">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-black">Contact Us</h2>
                        <p>
                            For any queries regarding these terms, reach out at <a href="mailto:support@blactify.com" className="text-black font-medium underline">support@blactify.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

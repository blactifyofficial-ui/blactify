"use client";

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
                </div>
            </div>
        </main>
    );
}

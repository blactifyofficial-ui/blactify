"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";

export function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="border-t border-zinc-50 bg-white px-6 py-12 pb-40 md:pb-12 font-sans">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                    <div className="space-y-6">
                        <h2 className="font-empire text-2xl tracking-tighter">BLACTIFY</h2>
                        <p className="max-w-xs text-xs font-medium leading-relaxed text-zinc-400 uppercase tracking-widest">
                            Premium meets timeless essentials for the modern aesthetic. Curated for those who appreciate the subtle art of details.
                        </p>
                        <p className="max-w-xs text-xs font-medium leading-relaxed text-zinc-400 uppercase tracking-widest">

                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 md:col-span-1">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black">Shop</h3>
                            <ul className="space-y-3 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                                <li><Link href="/shop" className="hover:text-black transition-colors">All Products</Link></li>
                                <li><Link href="/shop?cat=Essentials" className="hover:text-black transition-colors">Essentials</Link></li>
                                <li><Link href="/shop?cat=New" className="hover:text-black transition-colors">New Arrivals</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black">Support</h3>
                            <ul className="space-y-3 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                                <li><Link href="/orders" className="hover:text-black transition-colors">Orders</Link></li>
                                <li><Link href="/policy/shipping" className="hover:text-black transition-colors">Shipping</Link></li>
                                <li><Link href="/policy/privacy" className="hover:text-black transition-colors">Privacy</Link></li>
                                <li><Link href="/policy/terms" className="hover:text-black transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-between md:items-end">
                        <button
                            onClick={scrollToTop}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:underline group"
                        >
                            Back to Top <ArrowUp size={14} className="transition-transform group-hover:-translate-y-1" />
                        </button>
                        <p className="mt-8 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-200 md:mt-0">
                            © 2026 BLACTIFY CO.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

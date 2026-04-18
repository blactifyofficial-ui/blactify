export const preferredRegion = "sin1";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ShippingPolicyPage() {
    return (
        <main className="min-h-screen bg-black text-white pb-24 pt-8">
            <div className="mx-auto max-w-3xl px-6">
                <header className="mb-12">
                    <Link href="/" className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                        <ChevronLeft size={14} className="opacity-40" />
                        Back to Home
                    </Link>
                    <h1 className="font-empire text-5xl md:text-6xl text-white">Shipping Policy</h1>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Last Updated: February 2026</p>
                </header>

                <div className="prose prose-zinc prose-invert prose-sm max-w-none space-y-12 text-zinc-500 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Delivery Overview</h2>
                        <p>
                            We aim to deliver your premium essentials as swiftly as possible. Each order is handled with extreme care and precision, ensuring it arrives in perfect condition.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Shipping Rates & Estimates</h2>
                        <div className="overflow-hidden border border-white/10 rounded-lg">
                            <table className="w-full text-left text-xs uppercase tracking-widest">
                                <thead className="bg-white/5 font-bold text-white border-b border-white/10">
                                    <tr>
                                        <th className="px-4 py-3">Shipping Method</th>
                                        <th className="px-4 py-3">Estimated Delivery</th>
                                        <th className="px-4 py-3 text-right">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    <tr>
                                        <td className="px-4 py-4 font-medium text-white">Standard Shipping</td>
                                        <td className="px-4 py-4">3-5 Business Days</td>
                                        <td className="px-4 py-4 text-right">₹80.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-2">* Delivery timelines are estimates and may vary based on location and unforeseen circumstances.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Processing Time</h2>
                        <p>
                            Orders are processed within 24-48 hours of payment confirmation. Orders placed after 5 PM on Fridays or during the weekend will be processed the following Monday.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Order Tracking</h2>
                        <p>
                            Once your order has shipped, you will receive an email and SMS with your tracking information. You can track your order directly through our partner courier website or via the <Link href="/orders" className="text-white font-medium underline">My Orders</Link> section.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Damages</h2>
                        <p>
                            Blactify Studio is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.
                        </p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-12">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">International Shipping</h2>
                        <p>
                            Currently, we only ship within India. We are working hard to expand our logistics to support international aesthetics soon.
                        </p>
                    </section>
                    <section className="space-y-4 pt-12 border-t border-white/5">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Contact Us</h2>
                        <p>
                            If you have any questions about our shipping policy, please contact us at <a href="mailto:support@blactifystudio.com" className="text-white font-medium underline decoration-white/20 underline-offset-4">support@blactifystudio.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

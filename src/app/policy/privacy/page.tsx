export const preferredRegion = "sin1";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-black text-white pb-24 pt-8">
            <div className="mx-auto max-w-3xl px-6">
                <header className="mb-12">
                    <Link href="/" className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                        <ChevronLeft size={14} className="opacity-40" />
                        Back to Home
                    </Link>
                    <h1 className="font-empire text-5xl md:text-6xl text-white">Privacy Policy</h1>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Last Updated: February 2026</p>
                </header>

                <div className="prose prose-zinc prose-invert prose-sm max-w-none space-y-12 text-zinc-500 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Information Collection</h2>
                        <p>
                            We collect information from you when you visit our site, register an account, or complete a purchase. This information includes your name, email address, shipping address, and phone number.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">How we use your information</h2>
                        <p>
                            Your information allows us to:
                        </p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Process and fulfill your orders efficiently.</li>
                            <li>Improve our website and your shopping experience.</li>
                            <li>Send periodic updates about your order and promotional offers (if opted-in).</li>
                            <li>Prevent fraudulent transactions.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Data Security</h2>
                        <p>
                            We implement a variety of security measures to maintain the safety of your personal information. Your sensitive information (UPI, Cards) is encrypted via Secure Socket Layer (SSL) technology and handled by our secure payment partners (Razorpay). We do not store your payment details on our servers.
                        </p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-12">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Cookies</h2>
                        <p>
                            We use cookies to help us remember and process the items in your shopping bag and understand your preferences for future visits.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Third-Party Disclosure</h2>
                        <p>
                            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except to fulfill your order (e.g., shipping carriers and payment processors).
                        </p>
                    </section>
                    <section className="space-y-4 pt-12 border-t border-white/5">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@blactifystudio.com" className="text-white font-medium underline decoration-white/20 underline-offset-4">support@blactifystudio.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

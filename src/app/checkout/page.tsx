"use client";

import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ShoppingBag, ArrowLeft, Smartphone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CheckoutPage() {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showOrderSummary, setShowOrderSummary] = useState(false);

    const subtotal = getTotalPrice();
    const shipping = 80; // Standard shipping as per reference
    const total = subtotal + shipping;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    const handlePlaceOrder = (e: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            clearCart();
            alert("Order placed successfully!");
            router.push("/");
        }, 2000);
    };

    if (!isMounted) return null;

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="text-zinc-400" size={24} />
                </div>
                <h1 className="text-xl font-medium mb-4 text-zinc-900">Your cart is empty</h1>
                <Link href="/shop" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Return to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            {/* Left Column - Main Content */}
            <div className="flex-1 flex flex-col md:justify-start md:items-end pt-8 pb-12 px-6 md:px-12 bg-white order-2 md:order-1">
                <div className="w-full max-w-[580px] md:pr-14 lg:pr-20 space-y-8">
                    {/* Header Logo */}
                    <div className="flex items-center justify-between">
                        <Link href="/" className="font-bold text-2xl tracking-tight text-zinc-900">Blactify</Link>
                        <Link href="/cart" className="md:hidden text-blue-600 text-sm">Cart</Link>
                    </div>

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs text-zinc-500">
                        <Link href="/cart" className="hover:text-zinc-800 transition-colors">Cart</Link>
                        <span className="text-zinc-300">/</span>
                        <span className="font-medium text-zinc-900">Information</span>
                        <span className="text-zinc-300">/</span>
                        <span>Shipping</span>
                        <span className="text-zinc-300">/</span>
                        <span>Payment</span>
                    </nav>

                    {/* Mobile Order Summary Toggle */}
                    <div className="md:hidden border-y border-zinc-200 py-4 -mx-6 px-6 bg-zinc-50">
                        <button
                            onClick={() => setShowOrderSummary(!showOrderSummary)}
                            className="w-full flex items-center justify-between text-blue-600 text-sm font-medium"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-zinc-900">Show order summary</span>
                                {showOrderSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                            <span className="text-zinc-900 font-bold">₹{total.toFixed(2)}</span>
                        </button>

                        {showOrderSummary && (
                            <div className="pt-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {items.map((item) => (
                                    <div key={item.cartId || item.id} className="flex gap-4">
                                        <div className="relative w-16 h-16 border border-zinc-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
                                            <div className="absolute top-0 right-0 bg-zinc-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-lg font-medium opacity-90 z-10">
                                                {item.quantity}
                                            </div>
                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h4 className="text-sm font-medium text-zinc-900">{item.name}</h4>
                                            <p className="text-xs text-zinc-500">Size: {item.size || 'Standard'}</p>
                                        </div>
                                        <div className="flex flex-col justify-center items-end">
                                            <span className="text-sm font-medium text-zinc-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="space-y-3 pt-4 border-t border-zinc-200/50">
                                    <div className="flex justify-between text-sm text-zinc-600">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-600">
                                        <span>Shipping</span>
                                        <span>₹{shipping.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-zinc-900 pt-2">
                                        <span>Total</span>
                                        <span>INR ₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handlePlaceOrder} className="space-y-8">
                        {/* Contact Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-zinc-900">Contact</h2>
                                <Link href="#" className="text-sm text-blue-600 hover:underline">Log in</Link>
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                            />
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="news" className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600" />
                                <label htmlFor="news" className="text-sm text-zinc-600">Email me with news and offers</label>
                            </div>
                        </section>

                        {/* Delivery Section */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-medium text-zinc-900">Delivery</h2>
                            <div className="space-y-3">
                                <select className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-zinc-900" defaultValue="India">
                                    <option value="India">India</option>
                                </select>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        placeholder="First name (optional)"
                                        className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                    />
                                    <input
                                        placeholder="Last name"
                                        className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                    />
                                </div>

                                <input
                                    placeholder="Address"
                                    className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                />

                                <input
                                    placeholder="Apartment, suite, etc. (optional)"
                                    className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                />

                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        placeholder="City"
                                        className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                    />
                                    <select className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-zinc-900" defaultValue="">
                                        <option value="" disabled>State</option>
                                        <option value="MH">Maharashtra</option>
                                        <option value="KA">Karnataka</option>
                                        <option value="DL">Delhi</option>
                                        <option value="KL">Kerala</option>
                                        <option value="TN">Tamil Nadu</option>
                                    </select>
                                    <input
                                        placeholder="PIN code"
                                        className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        placeholder="Phone"
                                        className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">🇮🇳</div>
                                </div>
                                <div className="relative">
                                    <input
                                        placeholder="Secondary Phone (Optional)"
                                        className="w-full h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input type="checkbox" id="save" className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600" />
                                    <label htmlFor="save" className="text-sm text-zinc-600">Save this information for next time</label>
                                </div>
                            </div>
                        </section>

                        {/* Shipping Method */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-medium text-zinc-900">Shipping method</h2>
                            <div className="p-4 rounded-md border border-zinc-300 bg-zinc-50/50 flex justify-between items-center cursor-default hover:border-blue-600 transition-colors">
                                <span className="text-sm text-zinc-900 font-medium">Standard</span>
                                <span className="text-sm text-zinc-900 font-medium">₹{shipping.toFixed(2)}</span>
                            </div>
                        </section>

                        {/* Payment */}
                        <section className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-lg font-medium text-zinc-900">Payment</h2>
                                <p className="text-sm text-zinc-500">All transactions are secure and encrypted.</p>
                            </div>

                            <div className="border border-zinc-300 rounded-md overflow-hidden">
                                <div className="p-4 bg-zinc-50 border-b border-zinc-300 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border-[5px] border-blue-600 bg-white" />
                                        <span className="text-sm font-medium text-zinc-900">UPI</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {/* Simple visualization of UPI apps */}
                                        <div className="w-8 h-5 bg-white border border-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-600">GPay</div>
                                        <div className="w-8 h-5 bg-white border border-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-600">PhPe</div>
                                        <div className="w-8 h-5 bg-white border border-zinc-200 rounded flex items-center justify-center text-[8px] font-bold text-zinc-600">Paytm</div>
                                    </div>
                                </div>
                                <div className="p-8 bg-zinc-50/30 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                                        <Smartphone className="text-zinc-400" size={32} />
                                    </div>
                                    <p className="text-sm text-zinc-500 max-w-xs">
                                        After clicking &quot;Complete order&quot;, you will be redirected to complete your purchase securely.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Footer Actions */}
                        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 pt-4">
                            <Link href="/cart" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                <ArrowLeft size={14} />
                                Return to cart
                            </Link>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className={cn(
                                    "w-full md:w-auto px-8 py-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm",
                                    isProcessing && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isProcessing ? "Processing..." : "Complete order"}
                            </button>
                        </div>
                    </form>

                    {/* Legal Footer */}
                    <div className="pt-10 border-t border-zinc-200 mt-10">
                        <div className="flex gap-4 text-xs text-blue-600 underline">
                            <Link href="/policy/shipping">Shipping policy</Link>
                            <Link href="/policy/privacy">Privacy policy</Link>
                            <Link href="/policy/terms">Terms of service</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Summary Sidebar (Desktop) */}
            <div className="hidden md:block flex-1 bg-zinc-50 border-l border-zinc-200 pt-8 px-6 lg:px-12 order-1 md:order-2">
                <div className="w-full max-w-[420px] lg:pl-10 space-y-6 sticky top-8">
                    {items.map((item) => (
                        <div key={item.cartId || item.id} className="flex gap-4 items-center">
                            <div className="relative w-16 h-16 border border-zinc-200 rounded-lg bg-white overflow-hidden flex-shrink-0">
                                <div className="absolute top-0 right-0 bg-zinc-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-lg font-medium opacity-90 z-10">
                                    {item.quantity}
                                </div>
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <h4 className="text-sm font-medium text-zinc-900">{item.name}</h4>
                                <p className="text-xs text-zinc-500">Size: {item.size || 'Standard'}</p>
                            </div>
                            <div className="flex flex-col justify-center items-end">
                                <span className="text-sm font-medium text-zinc-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}

                    <div className="h-px w-full bg-zinc-200 my-4" />

                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                placeholder="Discount code"
                                className="flex-1 h-12 px-4 rounded-md border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow placeholder:text-zinc-500"
                            />
                            <button className="h-12 px-6 bg-zinc-200 text-zinc-500 text-sm font-medium rounded-md hover:bg-zinc-300 transition-colors cursor-not-allowed">
                                Apply
                            </button>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-200 my-4" />

                    <div className="space-y-3 text-sm text-zinc-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium text-zinc-900">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span className="font-medium text-zinc-900">₹{shipping.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-200 my-4" />

                    <div className="flex justify-between items-baseline">
                        <span className="text-base font-medium text-zinc-900">Total</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-zinc-500">INR</span>
                            <span className="text-2xl font-bold text-zinc-900">₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

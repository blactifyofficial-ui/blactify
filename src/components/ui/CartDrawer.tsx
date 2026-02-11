"use client";

import { useRouter } from "next/navigation";

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { loadRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/store/AuthContext";
import { useState } from "react";
import { saveOrder } from "@/lib/order-sync";

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}

export function CartDrawer({ isOpen, onClose, onAuthRequired }: {
    isOpen: boolean;
    onClose: () => void;
    onAuthRequired: () => void;
}) {
    const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
    const { user } = useAuth();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleCheckout = () => {
        if (!user) {
            onAuthRequired();
            return;
        }

        onClose();
        router.push("/checkout");
    };

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[70] bg-black/40 transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-[80] w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h2 className="font-empire text-xl text-black">Bag</h2>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 font-sans">
                        {items.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <ShoppingBag size={48} className="mb-4 text-zinc-300" />
                                <p className="text-zinc-500 font-medium">Your bag is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="relative h-24 w-20 overflow-hidden bg-zinc-100">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between">
                                                    <h3 className="text-sm font-bold uppercase tracking-tight text-black">{item.name}</h3>
                                                    <button onClick={() => removeItem(item.id)} className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-black">Remove</button>
                                                </div>
                                                <p className="text-xs text-zinc-400 uppercase tracking-widest">{item.category}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center border border-zinc-100">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                        className="p-1 hover:bg-zinc-50 text-black"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold text-black">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:bg-zinc-50 text-black"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-bold text-black">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="border-t border-zinc-100 px-6 py-6 font-sans bg-white">
                            <div className="mb-6 flex items-center justify-between">
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Total</span>
                                <span className="text-xl font-bold text-black">₹{getTotalPrice().toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className="w-full rounded-full bg-black py-4 text-xs font-bold uppercase tracking-widest text-white active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isCheckingOut ? "Processing..." : "Checkout"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

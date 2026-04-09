"use client";

import Link from "next/link";
import { Menu, Search, User, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

export function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const items = useCartStore((state) => state.items);
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);


    return (
        <header
            className="fixed top-0 left-0 right-0 z-[70] transition-all duration-500 ease-in-out px-4 md:px-12 bg-white/40 backdrop-blur-md text-black border-b border-zinc-200/50 h-20"
        >
            <div className="max-w-7xl mx-auto flex items-center h-full relative">
                {/* Left: Hamburger Menu */}
                <button
                    onClick={onMenuClick}
                    className="absolute left-0 p-2 hover:bg-zinc-100 rounded-full transition-colors z-10"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>

                {/* Center: Logo */}
                <div className="flex-1 flex justify-center">
                    <Link href="/" className="relative flex items-center justify-center group h-10">
                        <Image
                            src="/welcome-eye.png"
                            alt="Blactify"
                            width={120}
                            height={120}
                            className="h-10 md:h-14 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                            priority
                        />
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="absolute right-0 flex items-center gap-2 md:gap-4 z-10">
                    <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors" aria-label="Search">
                        <Search size={20} />
                    </button>
                    <Link href="/profile" className="p-2 hover:bg-zinc-100 rounded-full transition-colors" aria-label="Profile">
                        <User size={20} />
                    </Link>
                    <Link href="/cart" className="p-2 hover:bg-zinc-100 rounded-full transition-colors relative" aria-label="Cart">
                        <ShoppingBag size={20} />
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 bg-black text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}


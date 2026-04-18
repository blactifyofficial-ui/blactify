"use client";

import Link from "next/link";
import { Menu, Search, User, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

export default function TopNavbar({ onMenuClick, onSearchClick, onCartClick }: {
    onMenuClick: () => void;
    onSearchClick: () => void;
    onCartClick: () => void;
}) {
    const { items } = useCartStore();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-[1800px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onMenuClick}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors md:hidden"
                        aria-label="Menu"
                    >
                        <Menu size={20} strokeWidth={1.2} />
                    </button>
                    
                    <Link href="/" className="flex items-center gap-3">
                        <span className="font-yapari text-xl md:text-2xl tracking-tighter uppercase text-white">
                            STUDIO
                        </span>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-12">
                    <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">Home</Link>
                    <Link href="/shop" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">Store</Link>
                    <Link href="/support" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">Support</Link>
                </div>

                <div className="flex items-center gap-1 md:gap-4">
                    <button 
                        onClick={onSearchClick}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                        aria-label="Search"
                    >
                        <Search size={20} strokeWidth={1.2} />
                    </button>
                    <Link href="/profile" className="p-2 hover:bg-white/10 rounded-md transition-colors" aria-label="Profile">
                        <User size={20} strokeWidth={1.2} />
                    </Link>
                    <button 
                        onClick={onCartClick}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors relative" 
                        aria-label="Cart"
                    >
                        <ShoppingBag size={20} strokeWidth={1.2} />
                        {itemCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-white text-black text-[8px] font-black flex items-center justify-center rounded-full">
                                {itemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
}

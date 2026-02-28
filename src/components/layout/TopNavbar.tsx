"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/store/AuthContext";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import Image from "next/image";

export function TopNavbar({ onCartClick }: { onCartClick?: () => void }) {
    const [showFullText, setShowFullText] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const { getTotalItems } = useCartStore();
    const { user } = useAuth();
    const pathname = usePathname();
    const [lastPathname, setLastPathname] = useState(pathname);
    const cartItemCount = getTotalItems();

    // Text looping (3s delay)
    useEffect(() => {
        if (isMenuOpen) return; // Pause looping when menu is open for performance

        const interval = setInterval(() => {
            setShowFullText((prev) => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, [isMenuOpen]);

    // Close menu on path change
    useEffect(() => {
        if (pathname !== lastPathname) {
            const timer = setTimeout(() => {
                setIsMenuOpen(false);
                setLastPathname(pathname);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [pathname, lastPathname]);

    // Fetch products for Quick Shop when menu opens
    useEffect(() => {
        let isMounted = true;

        if (isMenuOpen && products.length === 0) {
            const fetchProducts = async () => {
                try {
                    const { data, error } = await supabase
                        .from("products")
                        .select("*, categories(name), product_images(url)")
                        .limit(4);

                    if (isMounted && data && !error) {
                        setProducts(data as Product[]);
                    }
                } catch (err) {
                    console.error("Error fetching quick shop products:", err);
                }
            };
            fetchProducts();
        }

        return () => {
            isMounted = false;
        };
    }, [isMenuOpen, products.length]);

    const navItems = [
        { label: "Store", href: "/shop" },
        { label: "Orders", href: "/orders" },
        {
            label: "Profile", href: user ? "/profile" : "#", onClick: () => {
                if (!user) {
                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                }
            }
        },
    ];

    const isHomePage = pathname === "/";

    return (
        <>
            <header
                className="fixed top-0 left-0 right-0 z-[70] transition-all duration-500 ease-in-out px-4 md:px-12 bg-white/40 backdrop-blur-md text-black border-b border-zinc-200/50 h-12"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
                    {/* Left: Hamburger */}
                    <div className="w-10 flex justify-start">
                        {!isHomePage && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="p-2 -ml-2 hover:bg-zinc-100/50 rounded-full transition-colors"
                                aria-label="Toggle Menu"
                            >
                                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        )}
                    </div>

                    {/* Center: Logo */}
                    <div className="flex-1 flex justify-center">
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className="relative flex items-center justify-center group h-10 overflow-hidden">
                            <span className="text-xl md:text-2xl font-empire invisible pointer-events-none whitespace-nowrap px-4">
                                Blactify Essentials
                            </span>
                            <span
                                className={cn(
                                    "text-xl md:text-2xl font-empire transition-all duration-500 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                                    showFullText ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
                                )}
                            >
                                blactify
                            </span>
                            <span
                                className={cn(
                                    "text-xl md:text-2xl font-empire transition-all duration-500 absolute inset-0 flex items-center justify-center whitespace-nowrap",
                                    showFullText ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                                )}
                            >
                                Blactify Essentials
                            </span>
                        </Link>
                    </div>

                    {/* Right: Cart */}
                    <div className="w-10 flex justify-end">
                        {!isHomePage && (
                            <button
                                onClick={onCartClick}
                                className="relative p-2 -mr-2 hover:bg-zinc-100/50 rounded-full transition-colors"
                                aria-label="Open Cart"
                            >
                                <ShoppingBag size={22} strokeWidth={2} />
                                {cartItemCount > 0 && (
                                    <span className="absolute right-1.5 top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Compact Top-to-Bottom Mobile Menu */}
            <div
                className={cn(
                    "fixed top-0 left-0 right-0 z-[65] transition-all duration-500 ease-in-out pointer-events-none",
                    isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
                )}
            >
                <div className="bg-white/95 backdrop-blur-xl pointer-events-auto flex flex-col pt-14 px-6 pb-6 border-b border-zinc-200/50 shadow-2xl">
                    <nav className="flex flex-col mb-4">
                        {navItems.map((item) => (
                            item.onClick ? (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        item.onClick?.();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 py-2 border-b border-zinc-100/50 group last:border-0"
                                >
                                    <span className="text-[13px] font-normal group-hover:pl-1 transition-all uppercase tracking-wider">{item.label}</span>
                                </button>
                            ) : (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 py-2 border-b border-zinc-100/50 group last:border-0"
                                >
                                    <span className="text-[13px] font-normal group-hover:pl-1 transition-all uppercase tracking-wider">{item.label}</span>
                                </Link>
                            )
                        ))}
                    </nav>

                    {/* Quick Shop Section */}
                    {products.length > 0 && (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Quick Shop</span>
                                <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="text-[8px] font-bold uppercase tracking-widest text-black underline underline-offset-4">View All</Link>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {products.map((p) => (
                                    <Link key={p.id} href={`/product/${p.handle || p.id}`} onClick={() => setIsMenuOpen(false)} className="group relative flex flex-col gap-1">
                                        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 rounded-sm">
                                            {(p.main_image || p.product_images?.[0]?.url) ? (
                                                <Image
                                                    src={p.main_image || p.product_images?.[0]?.url || ""}
                                                    alt={p.name}
                                                    fill
                                                    sizes="(max-width: 640px) 25vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-zinc-100" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-medium text-black truncate leading-tight">{p.name}</span>
                                            <span className="text-[7px] text-zinc-400">₹{(p.price_offer || p.price_base).toFixed(0)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}


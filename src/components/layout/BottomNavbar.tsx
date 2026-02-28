"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/store/AuthContext";

const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: LayoutGrid, label: "Shop", href: "/shop" },
    { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNavbar({
    onCartClick,
    onProfileClick
}: {
    onCartClick: () => void;
    onProfileClick?: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { getTotalItems } = useCartStore();
    const { user } = useAuth();
    const cartItemCount = getTotalItems();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-zinc-200/50 bg-white/40 backdrop-blur-md px-6 pb-safe">
            <div className="mx-auto flex h-full max-w-md items-center justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    const content = (
                        <div className="flex flex-col items-center justify-center gap-1 transition-colors">
                            <div className="flex h-12 w-12 items-center justify-center">
                                {item.label === "Profile" && user ? (
                                    <div className={cn(
                                        "h-7 w-7 overflow-hidden rounded-full border-2 transition-all",
                                        isActive ? "border-black scale-110" : "border-transparent"
                                    )}>
                                        {user.photoURL ? (
                                            <Image
                                                src={user.photoURL}
                                                alt={user.displayName || "User"}
                                                width={28}
                                                height={28}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500">
                                                <User size={16} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Icon
                                        size={24}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className="transition-transform active:scale-90"
                                    />
                                )}
                            </div>
                            <span className="sr-only">{item.label}</span>
                        </div>
                    );

                    if (item.label === "Profile") {
                        return (
                            <button
                                key={item.label}
                                aria-label="Profile"
                                onClick={() => {
                                    if (user) {
                                        router.push('/profile');
                                    } else if (onProfileClick) {
                                        onProfileClick();
                                    }
                                }}
                                className={cn(
                                    isActive ? "text-black" : "text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            className={cn(
                                isActive ? "text-black" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            {content}
                        </Link>
                    );
                })}

                <button
                    aria-label="Open Cart"
                    onClick={onCartClick}
                    className="relative flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                    <div className="relative flex h-12 w-12 items-center justify-center">
                        <ShoppingBag size={24} strokeWidth={2} className="transition-transform active:scale-90" />
                        {cartItemCount > 0 && (
                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                                {cartItemCount}
                            </span>
                        )}
                    </div>
                    <span className="sr-only">Cart</span>
                </button>
            </div>
        </nav>
    );
}

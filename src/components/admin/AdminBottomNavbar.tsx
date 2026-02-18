"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    Box,
    Tag,
    BarChart3,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { LogoutModal } from "@/components/ui/LogoutModal";

const NAV_ITEMS = [
    { name: "Dash", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Items", href: "/admin/products", icon: Box },
    { name: "Cats", href: "/admin/categories", icon: Tag },
    { name: "Stats", href: "/admin/reports", icon: BarChart3 },
];

export function AdminBottomNavbar() {
    const pathname = usePathname();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
        } finally {
            setIsLoggingOut(false);
            setIsLogoutModalOpen(false);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] h-20 bg-white/80 backdrop-blur-xl border-t border-zinc-100 md:hidden pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="mx-auto flex h-full items-center justify-around px-1 max-w-md">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-300",
                                isActive ? "text-black translate-y-[-1px]" : "text-zinc-400"
                            )}
                        >
                            <div className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500",
                                isActive ? "bg-black text-white shadow-lg shadow-black/20" : "hover:bg-zinc-50"
                            )}>
                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-tight",
                                isActive ? "opacity-100" : "opacity-60"
                            )}>{item.name}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="flex flex-1 flex-col items-center justify-center gap-1 group"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 border border-zinc-100 active:bg-red-50 active:text-red-500 transition-all">
                        <LogOut size={16} strokeWidth={2} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-tight text-zinc-400 opacity-60">Exit</span>
                </button>
            </div>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                loading={isLoggingOut}
            />
        </nav>
    );
}

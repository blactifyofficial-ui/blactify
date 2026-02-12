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
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Products", href: "/admin/products", icon: Box },
    { name: "Categories", href: "/admin/categories", icon: Tag },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export function AdminBottomNavbar() {
    const pathname = usePathname();

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-zinc-200 bg-white px-4 md:hidden pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="mx-auto flex h-full items-center justify-around max-w-md">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all",
                                isActive ? "text-black" : "text-zinc-400"
                            )}
                        >
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                                isActive ? "bg-zinc-100" : ""
                            )}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-red-500/70"
                >
                    <div className="flex h-10 w-10 items-center justify-center">
                        <LogOut size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Exit</span>
                </button>
            </div>
        </nav>
    );
}

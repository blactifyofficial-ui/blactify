"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, LayoutDashboard, Bell, ShoppingBag, Box, Tag, BarChart3, MessageSquare, Zap, Settings, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { useNotificationStore } from "@/store/useNotificationStore";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Notifications", href: "/admin/notifications", icon: Bell, showBadge: true },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag, showBadge: true },
    { name: "Products", href: "/admin/products", icon: Box },
    { name: "Drops", href: "/admin/drops", icon: Zap },
    { name: "Support", href: "/admin/support", icon: MessageSquare },
    { name: "Studio", href: "/admin/studio", icon: Camera },
    { name: "Categories", href: "/admin/categories", icon: Tag },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const hasNewOrder = useNotificationStore((state) => state.hasNewOrder);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            localStorage.removeItem("admin_session_start");
        } finally {
            setIsLoggingOut(false);
            setIsLogoutModalOpen(false);
        }
    };

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[115] md:hidden transition-opacity duration-500"
                    onClick={onClose}
                />
            )}

            {/* Sidebar content */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-[120] w-72 bg-black text-white flex flex-col h-full transition-transform duration-500 ease-in-out md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Desktop Logo & Close Button (Mobile Only) */}
                <div className="p-8 pt-16 md:pt-10 pb-6 border-b border-zinc-900/50 flex items-center justify-between shrink-0">
                    <Link href="/admin" className="flex flex-col gap-1 group">
                        <span className="text-xl uppercase tracking-tighter transition-all duration-300 group-hover:opacity-70 text-white">
                            BLACTIFY
                        </span>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Admin Panel</p>
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition-colors text-zinc-400"
                        >
                            <X size={24} />
                        </button>

                    </div>
                </div>

                <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        const showsBadge = item.showBadge && hasNewOrder;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => onClose?.()}
                                className={cn(
                                    "flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-semibold uppercase tracking-wide transition-all duration-300 relative",
                                    isActive
                                        ? "bg-white text-black shadow-xl shadow-white/10"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                                )}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {item.name}
                                {showsBadge && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                )}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-6 py-6 border-t border-zinc-900 shrink-0 space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-semibold uppercase text-zinc-400 shrink-0">
                            {auth.currentUser?.email?.charAt(0) || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide truncate text-white">
                                {auth.currentUser?.email?.split('@')[0] || "Admin"}
                            </p>
                            <p className="text-[9px] font-bold text-zinc-500 truncate lowercase mt-0.5">
                                {auth.currentUser?.email}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-semibold uppercase tracking-wide text-red-500 hover:bg-red-500/10 w-full transition-all duration-300 border border-transparent hover:border-red-500/20"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                loading={isLoggingOut}
            />
        </>
    );
}

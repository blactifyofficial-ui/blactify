"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";
import { useState, useEffect } from "react";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, signOut } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [isStoreExpanded, setIsStoreExpanded] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from("categories")
                    .select("name, products(id)");
                if (error) throw error;
                if (data) {
                    interface CategoryData {
                        name: string;
                        products: { id: string }[] | { id: string } | null;
                    }
                    const sorted = (data as unknown as CategoryData[])
                        .map((c) => ({
                            name: c.name,
                            count: Array.isArray(c.products) ? c.products.length : (c.products ? 1 : 0)
                        }))
                        .sort((a, b) => b.count - a.count)
                        .map(c => c.name);
                    setCategories(["All", ...sorted]);
                }
            } catch {
                // silenty fail, initial state is "All"
                setCategories(["All"]);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (pathname === "/shop") {
            setIsStoreExpanded(true);
        }
    }, [pathname]);

    const navItems = [
        { label: "Home", href: "/" },
        { label: "Store", href: "/shop", hasSubItems: true },
        { label: "Orders", href: "/orders" },
        { label: "Profile", href: "/profile" },
    ];

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            setShowLogoutModal(false);
            onClose();
        } catch {
            // Logout failure is rare but doesn't require user-facing log
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-[110] w-full max-w-[300px] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-100">
                        <span className="font-empire text-2xl tracking-tighter">BLACTIFY</span>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-50 rounded-full transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                        {navItems.filter(item => item.label !== "Profile").map((item) => {
                            const isActive = pathname === item.href;
                            if (item.hasSubItems) {
                                return (
                                    <div key={item.href} className="space-y-1">
                                        <div
                                            className={cn(
                                                "flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-200 cursor-pointer group",
                                                isActive
                                                    ? "bg-black text-white"
                                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                            )}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                className="flex-1"
                                            >
                                                <span className="font-empire text-[12px] tracking-wider">{item.label}</span>
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsStoreExpanded(!isStoreExpanded);
                                                }}
                                                className="p-1 hover:bg-white/10 rounded-lg transition-transform"
                                            >
                                                <ChevronDown
                                                    size={16}
                                                    className={cn("transition-transform duration-300", isStoreExpanded && "rotate-180")}
                                                />
                                            </button>
                                        </div>

                                        {/* Categories Submenu */}
                                        <div className={cn(
                                            "grid transition-all duration-300 ease-in-out pl-6",
                                            isStoreExpanded ? "grid-rows-[1fr] opacity-100 mt-2 mb-4" : "grid-rows-[0fr] opacity-0"
                                        )}>
                                            <div className="overflow-hidden space-y-1 border-l border-zinc-100 ml-2 pl-6">
                                                {categories.map((cat) => {
                                                    const params = new URLSearchParams(searchParams.toString());
                                                    if (cat === "All") {
                                                        params.delete("category");
                                                    } else {
                                                        params.set("category", cat.trim());
                                                    }
                                                    return (
                                                        <Link
                                                            key={cat}
                                                            href={`/shop?${params.toString()}`}
                                                            onClick={onClose}
                                                            className="block py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                                                        >
                                                            {cat}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-black text-white"
                                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                    )}
                                >
                                    <span className="font-empire text-[12px] tracking-wider">{item.label}</span>
                                    <ChevronRight
                                        size={14}
                                        className={cn(
                                            "transition-transform",
                                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                                        )}
                                    />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / User / Logout */}
                    <div className="p-4 border-t border-zinc-50 space-y-2">
                        {user ? (
                            <>
                                <Link
                                    href="/profile"
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center justify-between px-6 py-5 rounded-2xl transition-all duration-200 group",
                                        pathname === "/profile" ? "bg-black text-white" : "bg-zinc-50 hover:bg-zinc-100 text-zinc-900"
                                    )}
                                >
                                    <div className="flex flex-col overflow-hidden flex-1">
                                        <span className="font-empire text-[11px] tracking-wide truncate">
                                            {user.email?.split("@")[0]}
                                        </span>
                                        <span className="text-[9px] font-medium text-zinc-400 truncate mt-0.5">
                                            Account Details
                                        </span>
                                    </div>
                                    <ChevronRight size={14} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={() => setShowLogoutModal(true)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200"
                                >
                                    <span className="font-empire text-[11px] tracking-wide">Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/profile"
                                onClick={onClose}
                                className="w-full flex items-center justify-center px-4 py-6 bg-black text-white rounded-2xl font-empire text-[11px] tracking-wide active:scale-[0.98] transition-all"
                            >
                                Sign In / Register
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                loading={isLoggingOut}
            />
        </>
    );
}

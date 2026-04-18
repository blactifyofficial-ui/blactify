"use client";

import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import { X, ChevronRight, LogOut, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutModal } from "../ui/LogoutModal";

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user, isAdmin, signOut } = useAuth();
    const pathname = usePathname();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            setIsLogoutModalOpen(false);
            onClose();
        } finally {
            setIsLoggingOut(false);
        }
    };

    const categories = [
        { name: "Graphic Tees", href: "/shop?category=Graphic%20Tees" },
        { name: "Streetwear", href: "/shop?category=Streetwear" },
        { name: "Accessories", href: "/shop?category=Accessories" },
        { name: "New Arrivals", href: "/shop" },
    ];

    const legalItems = [
        { label: "Privacy Policy", href: "/policy/privacy" },
        { label: "Terms of Service", href: "/policy/terms" },
        { label: "Shipping Policy", href: "/policy/shipping" },
    ];

    const navItems = [
        { label: "Home", href: "/" },
        { label: "Store", href: "/shop", hasSubItems: true },
        { label: "Orders", href: "/orders" },
        { label: "Profile", href: "/profile" },
    ];

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-black/40 transition-opacity backdrop-blur-sm md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-[110] w-full max-w-[300px] bg-black border-r border-white/5 shadow-2xl transition-transform duration-500 ease-out md:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between px-6 py-6">
                        <span className="font-yapari text-2xl tracking-tighter uppercase text-white">
                            STUDIO
                        </span>
                        <button 
                            aria-label="Close" 
                            onClick={onClose} 
                            className="p-1 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                <div key={item.label}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center justify-between py-3 text-lg font-bold uppercase tracking-widest transition-all",
                                            pathname === item.href ? "text-white" : "text-zinc-600 hover:text-white"
                                        )}
                                    >
                                        {item.label}
                                        {item.hasSubItems && <ChevronRight size={14} className="opacity-20" />}
                                    </Link>
                                    
                                    {item.hasSubItems && pathname.startsWith(item.href) && (
                                        <div className="ml-4 mt-2 space-y-2 border-l border-white/5 pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                            {categories.map((cat) => (
                                                <Link
                                                    key={cat.name}
                                                    href={cat.href}
                                                    onClick={onClose}
                                                    className="block py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isAdmin && (
                            <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Management</p>
                                <div className="space-y-2">
                                    <Link
                                        href="/admin"
                                        onClick={onClose}
                                        className="flex items-center gap-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:opacity-70 transition-all"
                                    >
                                        <LayoutDashboard size={14} strokeWidth={2.5} />
                                        Admin Panel
                                    </Link>
                                    <Link
                                        href="/settings"
                                        onClick={onClose}
                                        className="flex items-center gap-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:opacity-70 transition-all"
                                    >
                                        <Settings size={14} strokeWidth={2.5} />
                                        Store Settings
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-white/5 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Legal</p>
                            <div className="space-y-2">
                                {legalItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={onClose}
                                        className="block py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </nav>

                    <div className="p-6 bg-zinc-950/50">
                        {user ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/5 rounded-md flex items-center justify-center border border-white/10">
                                        <span className="text-xs font-black text-white">{user.email?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-white truncate uppercase tracking-widest">{user.email}</p>
                                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Active Member</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500/80 hover:text-red-500 transition-colors py-2"
                                >
                                    <LogOut size={12} />
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/profile"
                                onClick={onClose}
                                className="block w-full py-4 bg-white text-black text-center text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-[0.98]"
                            >
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <LogoutModal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                onConfirm={handleLogout}
                loading={isLoggingOut}
            />
        </>
    );
}

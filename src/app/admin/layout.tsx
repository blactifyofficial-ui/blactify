"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Box,
    LayoutDashboard,
    LogOut,
    ShoppingBag
} from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { AdminBottomNavbar } from "@/components/admin/AdminBottomNavbar";
import { Toaster } from "sonner";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Products", href: "/admin/products", icon: Box },
    { name: "Sales Report", href: "/admin/reports", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const handleLogout = async () => {
        await signOut(auth);
    };

    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <AdminGuard>
            <Toaster
                position="top-center"
                toastOptions={{
                    classNames: {
                        toast: "rounded-full border border-zinc-100 shadow-xl p-2 px-4 font-inter bg-white w-auto min-w-fit max-w-[250px] mx-auto",
                        title: "font-bold text-sm",
                        description: "text-xs font-medium opacity-80",
                        // Default content styling
                        content: "flex items-center gap-3",
                    },
                }}
            />
            <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row pb-16 md:pb-0 font-inter">
                {/* Sidebar - Desktop */}
                <aside className="hidden md:flex w-64 bg-black text-white flex-col sticky top-0 h-screen">

                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? "bg-white text-black shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-zinc-900">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 w-full transition-all"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </aside>

                <AdminBottomNavbar />

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-10 w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { AuthProvider } from "@/store/AuthContext";
import { useNotificationStore } from "@/store/useNotificationStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const setHasNewOrder = useNotificationStore((state) => state.setHasNewOrder);

    // Clear notification when visiting orders page
    useEffect(() => {
        if (pathname === "/admin/orders") {
            setHasNewOrder(false);
        }
    }, [pathname, setHasNewOrder]);

    // Real-time listener for new orders
    useEffect(() => {
        const channel = supabase
            .channel('admin-orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    console.log('New order received:', payload);
                    setHasNewOrder(true);

                    // Small toast notification
                    toast.success("New Order!", {
                        description: `Order #${payload.new.id.slice(-6)} received`,
                        className: "font-sans",
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [setHasNewOrder]);

    if (pathname === "/admin/login") {
        return <AuthProvider>{children}</AuthProvider>;
    }

    return (
        <AuthProvider>
            <AdminGuard>
                <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-inter text-zinc-900">
                    <AdminMobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
                    <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                    <div className="flex-1 flex flex-col min-w-0 min-h-screen md:pl-72">
                        {/* Main Content */}
                        <main className="flex-1 p-4 md:p-10 w-full max-w-7xl mx-auto pt-[72px] md:pt-10 pb-10 overflow-x-hidden">
                            {children}
                        </main>
                    </div>
                </div>
            </AdminGuard>
        </AuthProvider>
    );
}

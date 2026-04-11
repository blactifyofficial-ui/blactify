"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import NotificationManager from "@/components/admin/NotificationManager";
import { useNotificationStore, type AdminNotification } from "@/store/useNotificationStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AdminNotificationDropdown } from "@/components/admin/AdminNotificationDropdown";
import { StoreStatusIndicator } from "@/components/admin/StoreStatusIndicator";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";

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

    // Register Service Worker manually for Admin side
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            const registerSW = async () => {
                try {
                    // Determine scope based on hostname
                    const isSubdomain = window.location.hostname.startsWith('admin.');
                    const swScope = isSubdomain ? "/" : "/admin";
                    
                    await navigator.serviceWorker.register("/sw.js", {
                        scope: swScope,
                    });
                } catch (err) {
                    console.error("Admin PWA: Service Worker registration failed:", err);
                }
            };

            if (document.readyState === "complete") {
                registerSW();
            } else {
                window.addEventListener("load", registerSW);
                return () => window.removeEventListener("load", registerSW);
            }
        }
    }, []);

    // Real-time listener for new orders and notifications
    useEffect(() => {
        const orderChannel = supabase
            .channel('admin-orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    setHasNewOrder(true);

                    // Small toast notification
                    toast.success("New Order!", {
                        description: `Order #${(payload.new as { id: string }).id.slice(-6)} received`,
                        className: "",
                    });
                }
            )
            .subscribe();

        const notificationChannel = supabase
            .channel('admin-notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const newNotif = payload.new as AdminNotification;
                    // Add to store if not already there
                    useNotificationStore.getState().addNotification(newNotif);
                    
                    // Show toast if it's not a new_order (which already has a toast above)
                    if (newNotif.type !== 'new_order') {
                        toast.info(newNotif.title, {
                            description: newNotif.body,
                            className: "",
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(orderChannel);
            supabase.removeChannel(notificationChannel);
        };
    }, [setHasNewOrder]);

    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <AdminGuard>
            <NotificationManager>
                <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-zinc-900">
                    <AdminMobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
                    <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                    <div className="flex-1 flex flex-col min-w-0 min-h-screen md:pl-72 relative">
                        {/* Desktop Header */}
                        <header className="hidden md:flex h-16 items-center justify-end px-10 sticky top-0 bg-zinc-50/0 backdrop-blur-0 z-[40]">
                            <div className="flex items-center gap-6 mt-4">
                                <StoreStatusIndicator />
                                <AdminNotificationDropdown />
                            </div>
                        </header>

                        {/* Main Content */}
                        <main className="flex-1 p-4 md:p-10 w-full max-w-7xl mx-auto pt-[72px] md:pt-10 pb-10 overflow-x-hidden">
                            <AdminBreadcrumbs />
                            {children}
                        </main>
                    </div>
                </div>
            </NotificationManager>
        </AdminGuard>
    );
}

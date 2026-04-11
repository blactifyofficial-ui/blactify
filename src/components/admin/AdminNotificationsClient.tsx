"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
    Bell, 
    Check, 
    Clock, 
    Package, 
    MessageSquare, 
    AlertCircle, 
    Info, 
    Search,
    Filter,
    Trash2,
    CheckCheck
} from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader, AdminCard, AdminLoading } from "./AdminUI";

type NotificationCategory = "all" | "orders" | "support" | "system";

export function AdminNotificationsClient() {
    const { notifications, setNotifications, markAsRead, clearAll } = useNotificationStore();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const response = await fetch("/api/admin/notifications", {
                headers: {
                    "Authorization": `Bearer ${idToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            toast.error("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    }, [user, setNotifications]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleAcknowledge = async (id: string) => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/admin/notifications/${id}/acknowledge`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${idToken}`
                }
            });
            if (response.ok) {
                markAsRead(id);
                toast.success("Notification marked as read");
            }
        } catch (err) {
            console.error("Failed to acknowledge notification:", err);
        }
    };

    const handleClearAll = async () => {
        if (!user || notifications.length === 0) return;
        if (!confirm("Are you sure you want to clear your entire inbox?")) return;
        
        try {
            const idToken = await user.getIdToken();
            const response = await fetch("/api/admin/notifications", {
                method: "PATCH", // API handles bulk mark-as-read
                headers: { "Authorization": `Bearer ${idToken}` }
            });
            
            if (response.ok) {
                clearAll();
                toast.success("Inbox cleared");
            }
        } catch (err) {
            console.error("Failed to clear inbox:", err);
        }
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const matchesSearch = 
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                n.body.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = 
                activeCategory === "all" || 
                (activeCategory === "orders" && n.type === "new_order") ||
                (activeCategory === "support" && n.type === "support") ||
                (activeCategory === "system" && n.type === "system");
            
            return matchesSearch && matchesCategory;
        });
    }, [notifications, searchQuery, activeCategory]);

    const getIcon = (type?: string) => {
        switch (type) {
            case "new_order": return <Package size={18} />;
            case "support": return <MessageSquare size={18} />;
            case "system": return <AlertCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    if (isLoading) return <AdminLoading message="Loading your communications..." />;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AdminPageHeader 
                title="Management Inbox" 
                subtitle="Centralized communication and system alerts"
            >
                <button 
                    onClick={handleClearAll}
                    disabled={notifications.length === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-black text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-30 shadow-lg"
                >
                    <Trash2 size={14} />
                    Clear All
                </button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <AdminCard className="p-6">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-4 flex items-center gap-2">
                                    <Filter size={12} />
                                    Categories
                                </h4>
                                <div className="space-y-1">
                                    {[
                                        { id: "all", label: "All Activity", icon: Bell },
                                        { id: "orders", label: "Order Alerts", icon: Package },
                                        { id: "support", label: "Support Tickets", icon: MessageSquare },
                                        { id: "system", label: "System Service", icon: AlertCircle }
                                    ].map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id as NotificationCategory)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-semibold uppercase tracking-tight transition-all",
                                                activeCategory === cat.id 
                                                    ? "bg-black text-white shadow-lg" 
                                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                                            )}
                                        >
                                            <cat.icon size={16} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-50">
                                <h4 className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-4">Search</h4>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                    <input 
                                        type="text"
                                        placeholder="Find alert..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-11 py-3 text-[11px] font-medium focus:outline-none focus:border-black transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </AdminCard>
                </div>

                {/* Notification List */}
                <div className="lg:col-span-3">
                    {filteredNotifications.length === 0 ? (
                        <AdminCard className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-zinc-50 flex items-center justify-center mb-6">
                                <Bell size={32} className="text-zinc-200" />
                            </div>
                            <h3 className="text-sm font-semibold uppercase text-zinc-900 mb-2">Inbox is empty</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest max-w-[200px]">
                                No new notifications found in this category.
                            </p>
                        </AdminCard>
                    ) : (
                        <div className="space-y-4">
                            {filteredNotifications.map((notif) => (
                                <div 
                                    key={notif.id}
                                    className={cn(
                                        "group bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden",
                                        notif.is_read 
                                            ? "border-zinc-50 opacity-60" 
                                            : "border-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1"
                                    )}
                                >
                                    {!notif.is_read && (
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
                                    )}
                                    
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-6",
                                            notif.type === "new_order" ? "bg-red-600 text-white" : "bg-black text-white"
                                        )}>
                                            {getIcon(notif.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-sm font-heading tracking-tight text-black uppercase">{notif.title}</h3>
                                                    {!notif.is_read && (
                                                        <span className="px-2 py-0.5 rounded-full bg-red-50/50 text-red-600 text-[8px] font-bold uppercase tracking-wider">New</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 lowercase tracking-tight">
                                                    <Clock size={12} />
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                </div>
                                            </div>

                                            <p className="text-[13px] font-medium text-zinc-500 leading-relaxed mb-6 max-w-2xl">
                                                {notif.body}
                                            </p>

                                            <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                                                <div className="flex items-center gap-6">
                                                    {!notif.is_read ? (
                                                        <button 
                                                            onClick={() => handleAcknowledge(notif.id)}
                                                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:text-red-600 transition-colors"
                                                        >
                                                            <CheckCheck size={14} strokeWidth={3} />
                                                            Acknowledge
                                                        </button>
                                                    ) : (
                                                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                                            <Check size={14} strokeWidth={3} />
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {notif.type === "new_order" && notif.data?.orderId && (
                                                    <Link 
                                                        href={`/admin/orders/${notif.data.orderId}`}
                                                        className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:underline"
                                                    >
                                                        View Order Details
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

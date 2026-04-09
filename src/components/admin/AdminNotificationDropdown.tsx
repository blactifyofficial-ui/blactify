"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, Package, MessageSquare, AlertCircle, X, Info } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function AdminNotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, setNotifications, markAsRead, clearAll } = useNotificationStore();
    const { user } = useAuth();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        const fetchNotifications = async () => {
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
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user, setNotifications]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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
                toast.success("Notification acknowledged");
            }
        } catch (err) {
            console.error("Failed to acknowledge notification:", err);
        }
    };

    const handleClearAll = async () => {
        if (!user || notifications.length === 0) return;
        try {
            const idToken = await user.getIdToken();
            if (unreadCount > 0) {
                await fetch("/api/admin/notifications", {
                    method: "PATCH",
                    headers: { "Authorization": `Bearer ${idToken}` }
                });
            }
            clearAll();
            toast.success("Inbox cleared");
        } catch (err) {
            console.error("Failed to clear inbox:", err);
        }
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case "new_order": return <Package className="text-white" size={14} />;
            case "support": return <MessageSquare className="text-white" size={14} />;
            case "system": return <AlertCircle className="text-white" size={14} />;
            default: return <Info className="text-white" size={14} />;
        }
    };

    const getIconBg = (type?: string) => {
        switch (type) {
            case "new_order": return "bg-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.3)]";
            default: return "bg-black shadow-[0_4px_12px_rgba(0,0,0,0.3)]";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative group active:scale-90",
                    unreadCount > 0 
                        ? "bg-white border border-red-100 shadow-[0_10px_30px_rgba(220,38,38,0.08)]" 
                        : "bg-white border border-zinc-100 shadow-sm md:hover:border-black md:hover:shadow-lg"
                )}
            >
                <Bell
                    size={20}
                    strokeWidth={2}
                    className={cn(
                        "transition-all duration-500",
                        unreadCount > 0 ? "text-red-600 animate-[bell-shake_1s_infinite]" : "text-zinc-400 group-hover:text-black"
                    )}
                />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 border-2 border-white rounded-full text-[10px] font-black flex items-center justify-center text-white shadow-md animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    className={cn(
                        "fixed sm:absolute right-4 sm:right-0 top-20 sm:top-full sm:mt-4 w-[calc(100vw-32px)] sm:w-[500px]",
                        "bg-white rounded-[2.5rem] shadow-[0_80px_100px_-30px_rgba(0,0,0,0.15)] z-[200] overflow-hidden flex flex-col",
                        "animate-[premium-spring_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_backwards]",
                        "border border-zinc-100"
                    )}
                >
                    <div className="relative p-8 bg-white">
                        <div className="relative flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600">
                                    Administration
                                </span >
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-black">
                                        Inbox
                                    </h3>
                                    {notifications.length > 0 && (
                                        <button 
                                            onClick={handleClearAll}
                                            className="px-5 py-2 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/20 transition-all active:scale-95 shadow-lg border border-white/10"
                                        >
                                            Clear Inbox
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-3 bg-zinc-50/50 border-y border-zinc-100 flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                             Real-time alerts
                         </span>
                         <div className="flex gap-4">
                             <div className="flex items-center gap-1.5">
                                 <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                 <span className="text-[9px] font-black uppercase text-zinc-900">{unreadCount} Pending</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                 <span className="text-[9px] font-black uppercase text-zinc-900">{notifications.length} Total</span>
                             </div>
                         </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar pb-4 max-h-[400px]">
                        {notifications.length === 0 ? (
                            <div className="px-10 py-20 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-8 relative">
                                    <Bell size={40} className="text-zinc-100" />
                                </div>
                                <h4 className="text-sm font-black uppercase text-zinc-900 mb-3 tracking-tight">Your tray is clear</h4>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed max-w-[200px]">
                                    No new notifications at the moment.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-50">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        className={cn(
                                            "p-7 transition-all duration-300 relative hover:bg-zinc-50/50 cursor-default group",
                                            notif.is_read ? "opacity-40" : "bg-white"
                                        )}
                                    >
                                        <div className="flex gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110",
                                                getIconBg(notif.type)
                                            )}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2 truncate">
                                                        {!notif.is_read && (
                                                            <div className="w-2 h-2 rounded-full bg-red-600 shrink-0 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                                                        )}
                                                        <h4 className="text-[14px] font-black uppercase text-zinc-900 truncate leading-none tracking-tight">
                                                            {notif.title}
                                                        </h4>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-zinc-400 shrink-0 uppercase tracking-tighter">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] font-medium text-zinc-500 line-clamp-2 leading-relaxed mb-5">
                                                    {notif.body}
                                                </p>
                                                
                                                <div className="flex items-center justify-between">
                                                    {!notif.is_read ? (
                                                        <button 
                                                            onClick={(e) => handleAcknowledge(notif.id, e)}
                                                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-tight hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-black/10"
                                                        >
                                                            <Check size={14} strokeWidth={3} />
                                                            Mark as Read
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                                                            Acknowledged
                                                        </div>
                                                    )}
                                                    
                                                    {notif.is_read && notif.read_at && (
                                                        <span className="text-[8px] font-black text-red-600/30 uppercase tracking-widest">
                                                            Deletes in 24h
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-6 bg-white border-t border-zinc-50 text-center flex items-center justify-center gap-3">
                         <div className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">
                             <Clock size={12} className="text-red-600/50" />
                             Acknowledged history clears daily
                         </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes premium-spring {
                    0% { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }

                @keyframes bell-shake {
                    0%, 100% { transform: rotate(0); }
                    10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); }
                    20%, 40%, 60%, 80% { transform: rotate(-10deg); }
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #f4f4f5;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #e4e4e7;
                }
            `}</style>
        </div>
    );
}

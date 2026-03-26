"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";

export function NotificationStatusCard() {
    const { user, isAdmin } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const syncToken = async () => {
        if (!messaging || !user || !isAdmin) return;
        
        try {
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });
            
            if (token) {
                await fetch("/api/admin/sync-fcm-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, userId: user.uid }),
                });
            }
        } catch (error) {
            console.error("FCM Sync Error:", error);
        }
    };

    const handleEnable = async () => {
        if (!("Notification" in window)) {
            toast.error("Notifications not supported on this browser.");
            return;
        }

        setIsUpdating(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === "granted") {
                await syncToken();
                toast.success("Notifications enabled successfully!");
            } else if (result === "denied") {
                toast.error("Permission denied. Please enable in browser settings.");
            }
        } catch (error) {
            toast.error("Failed to request permission.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isMounted || !isAdmin) return null;

    return (
        <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 h-[200px] flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/5">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Bell className="text-[#000000]" size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Admin Alerts</span>
                    </div>
                    <h4 className="text-2xl font-black text-[#000000] tracking-tighter leading-none pt-1">Device Notifications</h4>
                </div>
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    permission === "granted" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                )}>
                    {permission === "granted" ? <CheckCircle2 size={18} /> : <BellOff size={18} />}
                </div>
            </div>

            <div className="flex items-end justify-between">
                <p className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-[0.1em] pr-4 leading-relaxed">
                    {permission === "granted" ? "Live Alerts Active" : 
                     permission === "denied" ? "Access Blocked" : "Action Required"}
                </p>
                <button
                    onClick={handleEnable}
                    disabled={isUpdating || permission === "granted"}
                    className={cn(
                        "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm",
                        permission === "granted"
                            ? "bg-green-50 text-green-600 border border-green-100 cursor-default"
                            : "bg-black text-white hover:bg-zinc-800 border border-black",
                        isUpdating && "opacity-50 cursor-wait"
                    )}
                >
                    {isUpdating ? "Processing..." : permission === "granted" ? "Active" : "Enable Now"}
                </button>
            </div>
        </div>
    );
}

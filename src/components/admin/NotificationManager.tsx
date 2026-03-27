"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { useAuth } from "@/store/AuthContext";
import { useNotificationStore, type AdminNotification } from "@/store/useNotificationStore";
import { toast } from "sonner";

/**
 * NotificationManager handles Admin FCM Token registration and foreground messages.
 */
export default function NotificationManager({ children }: { children: React.ReactNode }) {
    const { user, isAdmin } = useAuth();
    const isRegistering = useRef(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const syncTokenWithServer = useCallback(async (token: string) => {
        if (!user) return;
        try {
            const userIdToken = await user.getIdToken();
            const response = await fetch("/api/admin/sync-fcm-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userIdToken}`
                },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                console.error("Failed to sync FCM token");
            }
        } catch (err) {
            console.error("Error syncing FCM token:", err);
        }
    }, [user]);

    const requestPermission = useCallback(async () => {
        if (!messaging) {
            console.error("FCM: messaging object is not initialized.");
            return;
        }
        if (typeof window === 'undefined' || !('Notification' in window)) {

            return;
        }



        // If permission already granted, or we are in the middle of registration, skip.
        if (Notification.permission === 'granted') {
             // Continue to get token
        } else if (Notification.permission === 'denied') {

             return;
        } else {
             const result = await Notification.requestPermission();
             if (result !== 'granted') return;
        }

        if (isRegistering.current) {

            return;
        }
        
        isRegistering.current = true;

        try {

            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
                await syncTokenWithServer(currentToken);
            }
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error('FCM: Error retrieving token: ', error);
            if (error.message?.includes("Missing registration")) {
                console.error("FCM: Missing service worker registration. Ensure the sw.js script exists.");
            }
        } finally {
            isRegistering.current = false;
        }
    }, [isAdmin, user, syncTokenWithServer]);

    const handleManualPermission = useCallback(async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        const result = await Notification.requestPermission();
        if (result === 'granted') {
            requestPermission();
        } else {
            toast.error("Permission denied. Please enable notifications in your browser settings.");
        }
    }, [requestPermission]);

    useEffect(() => {
        if (!isMounted) return;

        // Log the check
        if (isAdmin && user && typeof window !== 'undefined' && 'Notification' in window) {
            const currentPerm = Notification.permission;


            if (currentPerm === 'default') {

                // Regular toast for maximum visibility
                toast.success("🔔 Enable Push Notifications", {
                    description: "Get real-time alerts for your orders on this device.",
                    action: {
                        label: "Enable",
                        onClick: handleManualPermission
                    },
                    duration: 30000, // 30 seconds
                });
            } else if (currentPerm === 'granted') {

                requestPermission();
            }
        }
    }, [isAdmin, user, requestPermission, isMounted, handleManualPermission]);

    // Handle Foreground Messages
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {

            
            // 1. Update the local store immediately so the bell count updates
            const newNotif: AdminNotification = {
                id: payload.data?.id || Math.random().toString(36).substring(7),
                title: payload.notification?.title || "New Notification",
                body: payload.notification?.body || "",
                type: payload.data?.type || "unknown",
                data: payload.data || {},
                is_read: false,
                created_at: new Date().toISOString(),
            };
            addNotification(newNotif);

            // 2. Custom foreground toast
            toast(`🚨 ${payload.notification?.title || 'New Order!'}`, {
                description: payload.notification?.body,
                action: {
                    label: "View Orders",
                    onClick: () => window.location.href = '/admin/orders',
                },
            });
        });

        return () => unsubscribe();
    }, [addNotification]);

    return <>{children}</>;
}

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { useAuth } from "@/store/AuthContext";
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
            } else {
                console.log("FCM Token synced successfully");
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
            console.warn("FCM: Notifications NOT supported in this browser.");
            return;
        }

        console.log("FCM: requestPermission called. isAdmin:", isAdmin, "user:", user?.email);
        console.log("FCM: Current Notification permission:", Notification.permission);

        // If permission already granted, or we are in the middle of registration, skip.
        if (Notification.permission === 'granted') {
             // Continue to get token
        } else if (Notification.permission === 'denied') {
             console.log("FCM: Notifications explicitly BLOCKED by user.");
             return;
        } else {
             console.log("FCM: Requesting Permission...");
             const result = await Notification.requestPermission();
             console.log("FCM: Permission result:", result);
             if (result !== 'granted') return;
        }

        if (isRegistering.current) {
            console.log("FCM: Registration already in progress.");
            return;
        }
        
        isRegistering.current = true;

        try {
            console.log("FCM: Fetching token with VAPID Key...");
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
                console.log("FCM: Token successfully retrieved:", currentToken.substring(0, 10) + "...");
                await syncTokenWithServer(currentToken);
            } else {
                console.log('FCM: No registration token available.');
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

    const handleManualPermission = async () => {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
            requestPermission();
        } else {
            toast.error("Permission denied. Please enable notifications in your browser settings.");
        }
    };

    useEffect(() => {
        if (!isMounted) return;

        // Log the check
        if (isAdmin && user && typeof window !== 'undefined') {
            if (Notification.permission === 'default') {
                console.log("FCM: Permission is default. Will show prompt toast for user interaction.");
                // Instead of auto-requesting (which fails on iOS), we show a toast with a button
                toast("🔔 Enable Notifications", {
                    description: "Get real-time alerts for new orders.",
                    action: {
                        label: "Enable",
                        onClick: handleManualPermission
                    },
                    duration: 10000,
                });
            } else if (Notification.permission === 'granted') {
                requestPermission();
            }
        }
    }, [isAdmin, user, requestPermission]);

    // Handle Foreground Messages
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            
            // Custom foreground toast
            toast(`🚨 ${payload.notification?.title || 'New Order!'}`, {
                description: payload.notification?.body,
                action: {
                    label: "View Orders",
                    onClick: () => window.location.href = '/admin/orders',
                },
            });

            // Browser internal notification if tab is in focus?
            // Usually not needed if we show a custom toast, but FCM allows it.
        });

        return () => unsubscribe();
    }, []);

    return <>{children}</>;
}

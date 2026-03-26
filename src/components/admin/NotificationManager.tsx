"use client";

import { useEffect, useCallback, useRef } from "react";
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
        if (!messaging || typeof window === 'undefined' || !('Notification' in window)) return;

        // If permission already granted, or we are in the middle of registration, skip.
        if (Notification.permission === 'granted') {
             // Continue to get token
        } else if (Notification.permission === 'denied') {
             console.log("Notifications blocked by user.");
             return;
        } else {
             const result = await Notification.requestPermission();
             if (result !== 'granted') return;
        }

        if (isRegistering.current) return;
        isRegistering.current = true;

        try {
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
                await syncTokenWithServer(currentToken);
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
        } finally {
            isRegistering.current = false;
        }
    }, [syncTokenWithServer]);

    useEffect(() => {
        // Only request permission if user is ADMIN
        if (isAdmin && user) {
            requestPermission();
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

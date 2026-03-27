import { NextResponse } from "next/server";

export async function GET() {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const script = `
// Firebase Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = ${JSON.stringify(firebaseConfig)};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// SDK Background listener
messaging.onBackgroundMessage((payload) => {

  
  // Handled by SDK automatically if payload.notification exists.
  // Manual show for data-only messages.
  if (!payload.notification && payload.data) {
    self.registration.showNotification(payload.data.title || "New Alert", {
        body: payload.data.body || "",
        icon: '/logo.webp',
        badge: '/logo.webp',
        data: payload.data,
    });
  }
});

// Fallback Push Listener for Safari/iOS lock screen stability
self.addEventListener('push', (event) => {
    if (!event.data) return;
    try {
        const data = event.data.json();

        
        // If it's a notification-style payload but SDK background handler hasn't fired yet
        // note: FCM often nests things in 'notification' or 'data'
        const notification = data.notification || (data.data && data.data.notification ? JSON.parse(data.data.notification) : null);
        
        if (notification) {
            // We can optionally manually show here if we detect it's not being shown.
            // But usually raw 'push' listener is just for logging/debugging on iOS.
            // FCM SDK 'onBackgroundMessage' is better.
        }
    } catch (e) {
        console.error('[firebase-messaging-sw.js] Push processing error', e);
    }
});

// Click Interaction
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const clickAction = event.notification.data?.click_action || '/admin/orders';
    const urlToOpen = new URL(clickAction, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
`;

    return new NextResponse(script, {
        headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "public, max-age=0, must-revalidate",
        },
    });
}

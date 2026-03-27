import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging, Messaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Standard Fix for Safari/ITP: Ensure persistence is robust
import { setPersistence, browserLocalPersistence } from "firebase/auth";
if (typeof window !== "undefined") {
    // Force Local Persistence to avoid 'missing initial state' errors on page reloads/redirects in Safari
    setPersistence(auth, browserLocalPersistence).catch(err => {
        console.warn("Auth persistence failed:", err);
    });
}

// Initialize Analytics conditionally (only in browser and if supported)
const analytics = typeof window !== 'undefined'
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : null;

// Initialize Messaging safely
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
    isMessagingSupported().then(supported => {
        if (supported) {
            try {
                messaging = getMessaging(app);
            } catch (err) {
                console.warn("Firebase Messaging initialization failed:", err);
            }
        }
    });
}

export { auth, googleProvider, analytics, messaging };

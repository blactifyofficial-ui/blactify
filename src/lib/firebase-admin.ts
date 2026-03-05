import admin from 'firebase-admin';

if (!admin.apps.length) {
    let credential;
    try {
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(
                Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
            );
            credential = admin.credential.cert(serviceAccount);
        }
    } catch (e) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY", e);
    }

    admin.initializeApp({
        credential: credential || admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

export const authAdmin = admin.auth();

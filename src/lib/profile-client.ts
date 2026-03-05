import { User } from "firebase/auth";

export async function syncUserProfile(user: User): Promise<boolean> {
    if (!user) return false;

    try {
        const token = await user.getIdToken();
        const response = await fetch("/api/user/sync-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                id: user.uid,
                email: user.email,
                full_name: user.displayName,
                avatar_url: user.photoURL,
            }),
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.isAdmin || false;
    } catch {
        return false;
    }
}

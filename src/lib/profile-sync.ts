import { User } from "firebase/auth";
import { supabase } from "./supabase";

export async function syncUserProfile(user: User) {
    if (!user) return;

    try {
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.uid,
                email: user.email,
                full_name: user.displayName,
                avatar_url: user.photoURL,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id'
            });

        if (error) {
            console.group("🔴 Supabase Sync Error Detail");
            console.error("Message:", error.message);
            console.error("Details:", error.details);
            console.error("Code:", error.code);
            console.error("Hint:", error.hint);
            console.error("Full Object:", JSON.stringify(error, null, 2));
            console.groupEnd();
        }
    } catch (err) {
        console.error("🔴 Unexpected error in syncUserProfile:", err);
    }
}

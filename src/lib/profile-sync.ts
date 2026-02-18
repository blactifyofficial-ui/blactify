import { User } from "firebase/auth";
import { supabase } from "./supabase";

export async function syncUserProfile(user: User) {
    if (!user) return;

    try {
        const response = await fetch("/api/user/sync-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: user.uid,
                email: user.email,
                full_name: user.displayName,
                avatar_url: user.photoURL,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Profile sync API error:", error);
        }
    } catch (err) {
        console.error("Failed to sync profile:", err);
    }
}

export async function getWelcomeDiscountStatus(userId: string) {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("welcome_discount_used")
            .eq("id", userId)
            .single();

        if (error) return true; // Default to true (used) on error for safety
        return data?.welcome_discount_used ?? false;
    } catch (err) {

        return true;
    }
}

export async function markWelcomeDiscountUsed(userId: string) {
    try {
        await supabase
            .from("profiles")
            .update({ welcome_discount_used: true })
            .eq("id", userId);
    } catch (err) {

    }
}

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


    } catch (err) {

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

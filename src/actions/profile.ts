"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyActionAuth } from "@/lib/auth-server";

export async function getWelcomeDiscountStatus(userId: string, token: string) {
    try {
        const auth = await verifyActionAuth(token);
        if (auth.uid !== userId) throw new Error("Forbidden");

        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("welcome_discount_used")
            .eq("id", userId)
            .single();

        if (error) return true; // Default to true (used) on error for safety
        return data?.welcome_discount_used ?? false;
    } catch {
        return true;
    }
}

export async function markWelcomeDiscountUsed(userId: string, token: string) {
    try {
        const auth = await verifyActionAuth(token);
        if (auth.uid !== userId) throw new Error("Forbidden");

        await supabaseAdmin
            .from("profiles")
            .update({ welcome_discount_used: true })
            .eq("id", userId);

        return { success: true };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("markWelcomeDiscountUsed error:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

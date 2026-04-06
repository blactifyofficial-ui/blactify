"use server";

import { supabaseAdmin } from "../../lib/supabase-admin";
import { verifyActionAuth } from "../../lib/auth-server";

export async function recordProductInterest(data: {
    productId: string;
    productName: string;
    userId: string;
    email: string;
    fullName: string;
}, token: string) {
    try {
        const auth = await verifyActionAuth(token);
        if (auth.uid !== data.userId) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabaseAdmin
            .from("user_preferences")
            .insert({
                user_id: data.userId,
                product_id: data.productId,
                product_name: data.productName,
                email: data.email,
                full_name: data.fullName,
                created_at: new Date().toISOString()
            });

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: String(err) };
    }
}

export async function getUserPreferences() {
    try {
        const { data, error } = await supabaseAdmin
            .from("user_preferences")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, data: data };
    } catch (err) {
        return { success: false, error: String(err) };
    }
}

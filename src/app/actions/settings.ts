"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function getStoreSettings() {
    try {
        const { data, error } = await supabaseAdmin
            .from("store_settings")
            .select("*")
            .eq("id", true)
            .single();

        if (error) {
            console.error("Error fetching store settings:", error);
            // Return default if error (e.g. table doesn't exist yet)
            return { purchases_enabled: true };
        }

        return data;
    } catch (error) {
        console.error("Unexpected error fetching store settings:", error);
        return { purchases_enabled: true };
    }
}

export async function togglePurchaseStatus(status: boolean) {
    try {
        const { error } = await supabaseAdmin
            .from("store_settings")
            .upsert({ id: true, purchases_enabled: status });

        if (error) {
            console.error("Error updating store settings:", error);
            return { success: false, error: error.message };
        }

        // Send email notification (fire and forget)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/notify/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, user_email: "Admin Action" }),
        }).catch(err => console.error("Failed to trigger notification:", err));

        revalidatePath("/admin");
        revalidatePath("/checkout");
        revalidatePath("/cart");
        revalidatePath("/shop"); // Just in case we add indicators there

        return { success: true };
    } catch (error) {
        console.error("Unexpected error updating store settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

"use server";

import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
import { verifyActionAuth } from "./auth-server";

export async function fetchReviews(productId: string) {
    try {
        const { data, error } = await supabase
            .from("reviews")
            .select(`
                *,
                profiles (
                    full_name,
                    avatar_url
                )
            `)
            .eq("product_id", productId)
            .order("created_at", { ascending: false });

        if (error) {

            return [];
        }
        return data || [];
    } catch {
        return [];
    }
}

export async function postReview(reviewData: {
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
}, token: string) {
    try {
        const auth = await verifyActionAuth(token);

        // Rate Limiting: 5 reviews per 30 minutes
        const { rateLimit } = await import("./rate-limit");
        const limiter = await rateLimit(`post_review_${auth.uid}`, 5, 1800);
        if (!limiter.success) {
            return { success: false, error: "Too many reviews submitted. Please wait 30 minutes." };
        }

        if (auth.uid !== reviewData.user_id) {
            return { success: false, error: "Forbidden: You can only post reviews as yourself." };
        }

        const { error } = await supabaseAdmin
            .from("reviews")
            .insert({
                product_id: reviewData.product_id,
                user_id: reviewData.user_id,
                rating: reviewData.rating,
                comment: reviewData.comment,
                created_at: new Date().toISOString()
            });

        if (error) {

            return { success: false, error };
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

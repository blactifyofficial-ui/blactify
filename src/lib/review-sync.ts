import { supabase } from "./supabase";

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
            console.error("Error fetching reviews:", JSON.stringify(error, null, 2));
            return [];
        }
        return data || [];
    } catch (err) {
        console.error("Unexpected error in fetchReviews:", err);
        return [];
    }
}

export async function postReview(reviewData: {
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
}) {
    try {
        const { error } = await supabase
            .from("reviews")
            .insert({
                product_id: reviewData.product_id,
                user_id: reviewData.user_id,
                rating: reviewData.rating,
                comment: reviewData.comment,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error("Error posting review:", JSON.stringify(error, null, 2));
            return { success: false, error };
        }
        return { success: true };
    } catch (err) {
        console.error("Unexpected error in postReview:", err);
        return { success: false, error: err };
    }
}

import { supabaseAdmin } from "./supabase-admin";

/**
 * Advanced rate limiting utility using Supabase as a store.
 * Prevents brute-force, DDoS, and repetitive submissions.
 */

export async function rateLimit(
    key: string, 
    limit: number, 
    windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    try {
        // 1. Clean up old entries for this key (Selective cleanup to keep table performance)
        // Note: Global cleanup should ideally be a DB trigger or Cron.
        
        // 2. Count attempts in the window
        const { count, error } = await supabaseAdmin
            .from("rate_limits")
            .select("*", { count: "exact", head: true })
            .eq("key", key)
            .gt("created_at", windowStart.toISOString());

        if (error) {
            console.error("Rate limit check database error:", error.message);
            // On DB failure, we fail-open for UX but log for security review
            return { success: true, remaining: limit }; 
        }

        const currentCount = count || 0;
        
        if (currentCount >= limit) {
             const { logAction } = await import("./logger");
             await logAction({
                 action_type: "rate_limit_exceeded",
                 details: { key, limit, windowSeconds, currentCount },
                 user_email: "system@blactify.com",
                 severity: "warning"
             });
            return { success: false, remaining: 0 };
        }

        // 3. Record attempt
        await supabaseAdmin
            .from("rate_limits")
            .insert([{ key, created_at: now.toISOString() }]);

        return { success: true, remaining: limit - currentCount - 1 };
    } catch (err) {
        console.error("Critical error in rateLimit utility:", err);
        return { success: true, remaining: 1 };
    }
}

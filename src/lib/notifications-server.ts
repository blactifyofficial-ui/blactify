import { messagingAdmin } from "./firebase-admin";
import { supabaseAdmin } from "./supabase-admin";

/**
 * SEND NOTIFICATION TO ALL ADMINS
 * @param title 
 * @param body 
 * @param data 
 */
export async function sendMulticastAdminNotification(title: string, body: string, data?: Record<string, string>) {
    try {
        // Fetch tokens and filter duplicates/old ones
        // We only want the LATEST token for each user_id to prevent "doubling"
        // (e.g. if their PWA and browser both have active tokens)
        const { data: tokensList, error: fetchError } = await supabaseAdmin
            .from("admin_tokens")
            .select("token, user_id, created_at")
            .order('created_at', { ascending: false });

        if (fetchError || !tokensList) {
            console.error("FCM: Error fetching tokens or null response:", fetchError);
            return;
        }

        // Deduplicate by user_id: only take the most recent token per user
        const uniqueUserTokens = new Map<string, string>();
        tokensList.forEach((entry) => {
            if (!uniqueUserTokens.has(entry.user_id)) {
                uniqueUserTokens.set(entry.user_id, entry.token);
            }
        });

        const tokens = Array.from(uniqueUserTokens.values());
        
        if (tokens.length === 0) {
            console.log("No unique admin tokens found for notification.");
            return;
        }
        
        console.log(`FCM: Sending multicast to ${tokens.length} users (most recent device each)...`);

        // Requirement Payload:
        // Image : LOGO
        // Title: "🚨 New Order Received!"
        // Body: "Order #[ID] for $[Total] just came in By [UserEmail-subheading]"
        // Data: { orderId: "[ID]", type: "new_order" }

        // Ensure all data values are strings for FCM
        const stringifiedData: Record<string, string> = {};
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
            });
        }

        const message = {
            notification: {
                title,
                body,
                image: `${process.env.NEXT_PUBLIC_APP_URL || 'https://blactify.com'}/logo.webp`, // Logo as image/icon
            },
            data: {
                ...stringifiedData,
                click_action: "/admin/orders", // Matches SW click handle
            },
            tokens: tokens,
        };

        const response = await messagingAdmin.sendEachForMulticast(message);

        console.log(`FCM: Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);

        // Store the notification in the database for history/acknowledgement
        try {
            const { error: dbError } = await supabaseAdmin
                .from("notifications")
                .insert({
                    title,
                    body,
                    type: data?.type || "unknown",
                    data: data || {},
                    is_read: false,
                    created_at: new Date().toISOString()
                });

            if (dbError) {
                console.error("FCM: Error saving notification to database:", dbError);
            } else {
                console.log("FCM: Notification saved to database.");
            }
        } catch (dbErr) {
            console.error("FCM: Fatal error saving notification to database:", dbErr);
        }

        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    if (error) {
                        // Cleanup expired or "unregistered" tokens
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            failedTokens.push(tokens[idx]);
                        }
                    }
                }
            });

            if (failedTokens.length > 0) {
                console.log(`FCM: Cleaning up ${failedTokens.length} stale tokens...`);
                await supabaseAdmin
                    .from("admin_tokens")
                    .delete()
                    .in("token", failedTokens);
            }
        }
    } catch (err) {
        console.error("FCM: Fatal error sending multicast notification:", err);
    }
}

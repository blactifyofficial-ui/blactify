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
        console.log(`FCM: Fetching all active Admin tokens...`);
        const { data: tokensList, error: fetchError } = await supabaseAdmin
            .from("admin_tokens")
            .select("token, user_id");

        if (fetchError || !tokensList || tokensList.length === 0) {
            console.log("No admin tokens found for notification.");
            return;
        }

        const tokens = tokensList.map(t => t.token);

        console.log(`FCM: Sending multicast message to ${tokens.length} devices...`);

        // Requirement Payload:
        // Image : LOGO
        // Title: "🚨 New Order Received!"
        // Body: "Order #[ID] for $[Total] just came in By [UserEmail-subheading]"
        // Data: { orderId: "[ID]", type: "new_order" }

        const message = {
            notification: {
                title,
                body,
                imageUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://blactify.com'}/logo.webp`, // Logo as image/icon
            },
            data: {
                ...data,
                click_action: "/admin/orders", // Matches SW click handle
            },
            tokens: tokens,
        };

        const response = await messagingAdmin.sendEachForMulticast(message);
        
        console.log(`FCM: Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);

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

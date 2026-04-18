"use server";

import { verifyActionAuth } from "@/lib/auth-server";
import { SELLER_CONFIG } from "@/lib/config";
import { Resend } from "resend";
import { sendMulticastAdminNotification } from "@/lib/notifications-server";
import { logAction } from "@/lib/logger";

export async function sendTestNotification(
    type: "email" | "telegram" | "push",
    to: string,
    subject: string,
    body: string,
    token?: string
) {
    try {
        await verifyActionAuth(token);

        if (type === "email") {
            if (!SELLER_CONFIG.resendApiKey) {
                return { success: false, error: "Resend API key is not configured in environment variables." };
            }
            const resend = new Resend(SELLER_CONFIG.resendApiKey);
            const { error } = await resend.emails.send({
                from: SELLER_CONFIG.fromEmail || "onboarding@resend.dev",
                to: to || SELLER_CONFIG.email,
                subject: subject || "Test Notification from Blactify Studio Dev Portal",
                html: `<div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #333;">Dev Portal Test Notification</h2>
                    <p style="white-space: pre-wrap;">${body}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999;">Sent from Blactify Studio Developer Mission Control</p>
                </div>`,
            });
            if (error) throw error;
            
            await logAction({
                action_type: "notification_sent",
                severity: "info",
                details: { type, to, subject, body: body.slice(0, 50) + "..." },
                user_email: (await verifyActionAuth(token)).email
            });

            return { success: true };
        }

        if (type === "telegram") {
            if (!SELLER_CONFIG.telegramToken || !SELLER_CONFIG.telegramChatId) {
                return { success: false, error: "Telegram Bot Token or Chat ID is not configured." };
            }
            const telegramUrl = `https://api.telegram.org/bot${SELLER_CONFIG.telegramToken}/sendMessage`;
            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: SELLER_CONFIG.telegramChatId,
                    text: body,
                    parse_mode: 'Markdown',
                }),
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.description || "Failed to send Telegram message");
            
            await logAction({
                action_type: "notification_sent",
                severity: "info",
                details: { type, to, body: body.slice(0, 50) + "..." },
                user_email: (await verifyActionAuth(token)).email
            });

            return { success: true };
        }

        if (type === "push") {
            let pushTitle = "Test Push Notification";
            let pushBody = body;
            let pushData = {};

            try {
                const parsed = JSON.parse(body);
                pushTitle = parsed.title || pushTitle;
                pushBody = parsed.body || pushBody;
                pushData = parsed;
            } catch {
                // Not JSON, use as plain body
            }

            await sendMulticastAdminNotification(pushTitle, pushBody, pushData as Record<string, string>);
            
            await logAction({
                action_type: "notification_sent",
                severity: "info",
                details: { type, title: pushTitle, body: pushBody.slice(0, 50) },
                user_email: (await verifyActionAuth(token)).email
            });

            return { success: true };
        }

        return { success: false, error: "Invalid notification type" };
    } catch (err: unknown) {
        console.error("Playground: Send failure:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to send notification";
        return { success: false, error: errorMessage };
    }
}

export async function generateStressTestOrdersAction(token?: string) {
    try {
        await verifyActionAuth(token);
        
        // Random count between 10 and 20
        const count = Math.floor(Math.random() * 11) + 10;
        const results = [];

        for (let i = 0; i < count; i++) {
            // Random amount between 458 and 5000
            const amount = Math.floor(Math.random() * (5000 - 458 + 1)) + 458;
            const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-ST`;
            
            const pushTitle = "🚨 New Order Received!";
            const pushBody = `Order #${orderId} • ₹${amount.toLocaleString('en-IN')} via PWA Storefront`;
            
            const pushData = {
                title: pushTitle,
                body: pushBody,
                orderId: orderId,
                amount: amount.toString(),
                type: "new_order"
            };

            await sendMulticastAdminNotification(pushTitle, pushBody, pushData);
            results.push({ orderId, amount });
        }

        const authUser = await verifyActionAuth(token);
        await logAction({
            action_type: "stress_test_orders_generated",
            severity: "warning",
            details: { count, orders: results },
            user_email: authUser.email
        });

        return { success: true, count, orders: results };
    } catch (err: unknown) {
        console.error("Stress Test failure:", err);
        return { 
            success: false, 
            error: err instanceof Error ? err.message : "Failed to generate stress test orders" 
        };
    }
}

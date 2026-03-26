"use server";

import { verifyActionAuth } from "@/lib/auth-server";
import { SELLER_CONFIG } from "@/lib/config";
import { Resend } from "resend";
import { sendMulticastAdminNotification } from "@/lib/notifications-server";

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
                subject: subject || "Test Notification from Blactify Dev Portal",
                html: `<div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #333;">Dev Portal Test Notification</h2>
                    <p style="white-space: pre-wrap;">${body}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #999;">Sent from Blactify Developer Mission Control</p>
                </div>`,
            });
            if (error) throw error;
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
            return { success: true };
        }

        return { success: false, error: "Invalid notification type" };
    } catch (err: unknown) {
        console.error("Playground: Send failure:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to send notification";
        return { success: false, error: errorMessage };
    }
}

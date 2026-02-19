"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";

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
            // Return default if error (e.g. table doesn't exist yet)
            return { purchases_enabled: true };
        }

        return data;
    } catch {
        return { purchases_enabled: true };
    }
}

export async function togglePurchaseStatus(status: boolean) {
    try {
        const { error } = await supabaseAdmin
            .from("store_settings")
            .upsert({ id: true, purchases_enabled: status });

        if (error) {
            return { success: false, error: error.message };
        }

        // Send email notification directly using Resend
        if (SELLER_CONFIG.resendApiKey) {
            try {
                const resend = new Resend(SELLER_CONFIG.resendApiKey);
                const statusText = status ? "ENABLED" : "DISABLED";
                const statusColor = status ? "#10b981" : "#ef4444";
                const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

                const html = `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eeeeee; border-radius: 12px; overflow: hidden; color: #333333;">
                        <div style="background-color: #333639; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: 0.2em; font-size: 24px; font-weight: 800;">
                                BLACTIFY
                            </h1>
                        </div>
                        
                        <div style="padding: 40px; text-align: center;">
                            <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #111111; text-transform: uppercase; letter-spacing: 0.05em;">
                                Store Status Update
                            </h2>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Current Status</p>
                                <p style="margin: 0; color: ${statusColor}; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">
                                    ${statusText}
                                </p>
                            </div>

                            <div style="text-align: left; background-color: #fcfcfc; padding: 20px; border-radius: 8px; font-size: 13px; color: #444444; line-height: 1.6;">
                                <p style="margin: 0;"><strong>Updated By:</strong> Admin (Manual Action)</p>
                                <p style="margin: 5px 0 0 0;"><strong>Timestamp:</strong> ${timestamp}</p>
                            </div>
                        </div>

                        <div style="background-color: #fcfcfc; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; font-size: 12px; color: #aaaaaa; letter-spacing: 0.05em;">
                                &copy; ${new Date().getFullYear()} BLACTIFY. All rights reserved.
                            </p>
                        </div>
                    </div>
                `;

                await resend.emails.send({
                    from: SELLER_CONFIG.fromEmail,
                    to: [SELLER_CONFIG.email],
                    subject: `[ALERT] Store Purchases ${statusText}`,
                    html: html,
                });
            } catch {
                // Ignore email errors
            }
        }

        revalidatePath("/admin");
        revalidatePath("/checkout");
        revalidatePath("/cart");
        revalidatePath("/shop"); // Just in case we add indicators there

        return { success: true };
    } catch {
        return { success: false, error: "Failed to update settings" };
    }
}

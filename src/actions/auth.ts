"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";
import { EmailSchema, OTPSchema } from "@/lib/schemas";

// Helper to generate a 6-character alphanumeric OTP
function generateOTP(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otp;
}

export async function sendSignupOTP(email: string) {
    try {
        const validatedEmail = EmailSchema.safeParse(email);
        if (!validatedEmail.success) {
            return { success: false, error: validatedEmail.error.issues[0].message };
        }
        const emailToProcess = validatedEmail.data;

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", emailToProcess)
            .maybeSingle();

        if (checkError) {
            console.error("Error checking existing user:", checkError);
        }

        if (existingUser) {
            return { success: false, error: "An account with this email already exists." };
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Store OTP in Supabase
        const { error: dbError } = await supabaseAdmin
            .from("signup_otps")
            .insert([
                {
                    email: emailToProcess,
                    otp_hash: otp, // Storing as plain text for simplicity in this demo, usually should be hashed
                    expires_at: expiresAt.toISOString(),
                }
            ]);

        if (dbError) throw dbError;

        // Send Email via Resend
        if (SELLER_CONFIG.resendApiKey) {
            const resend = new Resend(SELLER_CONFIG.resendApiKey);

            const emailHtml = `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 400px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; text-align: center; color: #111; background-color: #ffffff;">
                    <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 6px; margin-bottom: 30px; color: #000;">BLACTIFY</h1>
                    <p style="font-size: 14px; color: #666; margin-bottom: 30px; line-height: 1.6;">Use the verification code below to complete your registration.</p>
                    
                    <div style="margin-bottom: 35px;">
                        <div style="display: inline-block; background: #f4f4f4; padding: 24px 40px; border-radius: 16px; border: 1px solid #eee;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #000; -webkit-user-select: all; user-select: all;">${otp}</span>
                        </div>
                        <p style="font-size: 10px; color: #999; margin-top: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">↑ Double click to select & copy</p>
                    </div>

                    <p style="font-size: 11px; color: #bbb; text-transform: uppercase; letter-spacing: 2px;">This code expires in 10 minutes</p>
                    
                    <div style="margin-top: 50px; border-top: 1px solid #f8f8f8; padding-top: 25px;">
                        <p style="font-size: 9px; color: #ddd; text-transform: uppercase; letter-spacing: 3px; font-weight: 800;">Authentic Streetwear Culture</p>
                    </div>
                </div>
            `;

            await resend.emails.send({
                from: SELLER_CONFIG.fromEmail,
                to: [emailToProcess],
                subject: `${otp} is your verification code`,
                html: emailHtml,
            });
        }

        return { success: true };
    } catch (err: unknown) {
        console.error("Failed to send OTP:", err);
        return { success: false, error: err instanceof Error ? err.message : "Failed to send OTP" };
    }
}

export async function verifySignupOTP(email: string, otp: string) {
    try {
        const validatedEmail = EmailSchema.safeParse(email);
        const validatedOTP = OTPSchema.safeParse(otp);

        if (!validatedEmail.success) return { success: false, error: validatedEmail.error.issues[0].message };
        if (!validatedOTP.success) return { success: false, error: validatedOTP.error.issues[0].message };

        const emailToProcess = validatedEmail.data;
        const otpToProcess = validatedOTP.data;

        // Fetch OTP from Supabase
        const { data, error: dbError } = await supabaseAdmin
            .from("signup_otps")
            .select("*")
            .eq("email", emailToProcess)
            .eq("otp_hash", otpToProcess.toUpperCase()) // Case-insensitive match if stored as upper
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (dbError || !data) {
            return { success: false, error: "Invalid or expired OTP" };
        }

        // OTP is valid! Delete it now (auto delete after use)
        await supabaseAdmin
            .from("signup_otps")
            .delete()
            .eq("email", emailToProcess);

        return { success: true };
    } catch (err: unknown) {
        console.error("Failed to verify OTP:", err);
        return { success: false, error: err instanceof Error ? err.message : "Verification failed" };
    }
}

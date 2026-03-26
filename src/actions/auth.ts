"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";
import { EmailSchema, OTPSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { createHash } from "crypto";
import { authAdmin } from "@/lib/firebase-admin";

/**
 * --- SECURITY IMPROVEMENTS ---
 * 1. OTP Hashing: We use SHA-256 to hash the OTP before storing it.
 * 2. Rate Limiting: Prevents attackers from spamming emails or brute-forcing OTPs.
 * 3. Session Expiry & Auto-Cleanup: Controlled by Supabase's expires_at.
 * 4. Password Reset Support: Leverages Firebase Auth's built-in security.
 */

// Helper to generate a 6-character alphanumeric OTP
function generateOTP(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otp;
}

// Securely hash OTP before persistence
function hashOTP(otp: string): string {
    return createHash("sha256").update(otp.toUpperCase()).digest("hex");
}

export async function sendSignupOTP(email: string) {
    try {
        const validatedEmail = EmailSchema.safeParse(email);
        if (!validatedEmail.success) {
            return { success: false, error: validatedEmail.error.issues[0].message };
        }
        const emailToProcess = validatedEmail.data;

        // 1. Rate Limiting (Prevent email and IP spam)
        const { getClientIP } = await import("@/lib/auth-server");
        const ip = await getClientIP();
        
        // Per-email limit: 3 per 5 mins
        const emailLimiter = await rateLimit(`otp_send_email_${emailToProcess}`, 3, 300);
        // Per-IP limit: 5 per 5 mins
        const ipLimiter = await rateLimit(`otp_send_ip_${ip}`, 5, 300);

        if (!emailLimiter.success || !ipLimiter.success) {
            return { success: false, error: "Too many attempts. Please try again later." };
        }

        // 2. Check if user already exists in Firebase (More reliable than Supabase profiles for auth)
        try {
            const userRecord = await authAdmin.getUserByEmail(emailToProcess);
            if (userRecord) {
                return { success: false, error: "An account with this email already exists." };
            }
        } catch {
            // User not found in Firebase, proceed
        }

        const otp = generateOTP();
        const otpHashed = hashOTP(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // 3. Store hashed OTP in Supabase
        const { error: dbError } = await supabaseAdmin
            .from("signup_otps")
            .insert([
                {
                    email: emailToProcess,
                    otp_hash: otpHashed, 
                    expires_at: expiresAt.toISOString(),
                }
            ]);

        if (dbError) throw dbError;

        // 4. Send Email via Resend
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
        const otpHashed = hashOTP(otpToProcess);

        // 1. Rate Limiting (Prevent OTP brute force)
        const limiter = await rateLimit(`otp_verify_${emailToProcess}`, 5, 300); // 5 attempts per 5 mins
        if (!limiter.success) {
            return { success: false, error: "Too many incorrect attempts. Please wait 5 minutes." };
        }

        // 2. Fetch hashed OTP from Supabase
        const { data, error: dbError } = await supabaseAdmin
            .from("signup_otps")
            .select("*")
            .eq("email", emailToProcess)
            .eq("otp_hash", otpHashed) 
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (dbError || !data) {
            return { success: false, error: "Invalid or expired OTP" };
        }

        // 3. OTP is valid! Delete it now
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

/**
 * Send password reset email via Firebase/Resend.
 * Firebase allows us to generate password reset links that automatically expire.
 */
export async function sendPasswordReset(email: string) {
    try {
        const validatedEmail = EmailSchema.safeParse(email);
        if (!validatedEmail.success) {
            return { success: false, error: "Invalid email address" };
        }
        const emailToProcess = validatedEmail.data;

        // Rate Limiting (Prevent reset spam)
        const limiter = await rateLimit(`pw_reset_${emailToProcess}`, 2, 3600); // 2 attempts per hour
        if (!limiter.success) {
            return { success: false, error: "Reset link already sent. Please check your inbox or wait one hour." };
        }

        // Generate Firebase Reset Link
        const resetLink = await authAdmin.generatePasswordResetLink(emailToProcess);

        if (SELLER_CONFIG.resendApiKey) {
            const resend = new Resend(SELLER_CONFIG.resendApiKey);
            
            const emailHtml = `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 400px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; text-align: center; color: #111; background-color: #ffffff;">
                    <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 6px; margin-bottom: 30px; color: #000;">BLACTIFY</h1>
                    
                    <p style="font-size: 14px; color: #666; margin-bottom: 30px; line-height: 1.6;">Use the secure link below to reset your password.</p>
                    
                    <div style="margin-bottom: 35px;">
                        <a href="${resetLink}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 16px 32px; border-radius: 100px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Reset Password</a>
                    </div>

                    <p style="font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 2px;">This link expires in 1 hour.</p>
                </div>
            `;

            await resend.emails.send({
                from: SELLER_CONFIG.fromEmail,
                to: [emailToProcess],
                subject: "Reset your Blactify password",
                html: emailHtml,
            });
        }

        return { success: true };
    } catch (err) {
        console.error("Password reset error:", err);
        return { success: false, error: "Failed to send reset link." };
    }
}


import { NextResponse } from "next/server";
import { Resend } from "resend";
import { SELLER_CONFIG } from "@/lib/config";

// Force dynamic since we're reading environment variables
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { status, user_email } = await req.json(); // status: boolean

        if (!SELLER_CONFIG.resendApiKey) {
            return NextResponse.json({ success: false, error: "Resend API key missing" });
        }

        const resend = new Resend(SELLER_CONFIG.resendApiKey);

        const statusText = status ? "ENABLED" : "DISABLED";
        const statusColor = status ? "#10b981" : "#ef4444"; // Green or Red
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const html = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eeeeee; border-radius: 12px; overflow: hidden; color: #333333;">
                <div style="background-color: #000000; padding: 30px; text-align: center;">
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
                        <p style="margin: 0;"><strong>Updated By:</strong> Admin (${user_email || 'Unknown'})</p>
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

        const { data, error } = await resend.emails.send({
            from: "Blactify Ops <onboarding@resend.dev>", // Using standard Resend onboarding for dev
            to: [SELLER_CONFIG.email], // Reverting to authorized email due to Resend Test Mode restriction
            subject: `[ALERT] Store Purchases ${statusText}`,
            html: html,
        });

        if (error) {
            console.error("Resend Error:", error);
            return NextResponse.json({ success: false, error });
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Notification Error:", error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}

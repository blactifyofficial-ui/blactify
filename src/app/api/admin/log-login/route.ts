import { NextResponse } from "next/server";
import { logAction } from "@/lib/logger";
import { verifyAdminAuth } from "@/lib/auth-server";

export const preferredRegion = "sin1";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, success, error } = body;
        const userAgent = request.headers.get("user-agent");

        if (success) {
            // Only admins should trigger admin_login success logs
            const authResult = await verifyAdminAuth(request);
            if (authResult.error) return authResult.error;

            // Ensure the email being logged matches the authenticated user
            if (authResult.email !== email) {
                return NextResponse.json({ error: "Audit log mismatch" }, { status: 403 });
            }
        }

        await logAction({
            action_type: "admin_login",
            user_email: email,
            details: {
                success,
                error: error || null,
                user_agent: userAgent
            },
            severity: success ? "info" : "warning"
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

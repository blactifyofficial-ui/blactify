import { NextResponse } from "next/server";
import { logAction } from "@/lib/logger";

export const preferredRegion = "sin1";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, success, error } = body;

        await logAction({
            action_type: "admin_login",
            user_email: email,
            details: {
                success,
                error: error || null,
                user_agent: request.headers.get("user-agent")
            },
            severity: success ? "info" : "warning"
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

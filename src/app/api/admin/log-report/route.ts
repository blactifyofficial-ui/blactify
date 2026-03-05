import { NextResponse } from "next/server";
import { logAction } from "@/lib/logger";
import { verifyAdminAuth } from "@/lib/auth-server";

export const preferredRegion = "sin1";

export async function POST(request: Request) {
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;
    try {
        const body = await request.json();
        const { type } = body;

        await logAction({
            action_type: "report_export",
            details: { type },
            user_email: auth.email,
            severity: "info"
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

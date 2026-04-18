import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminAuth } from "@/lib/auth-server";

/**
 * SYNC FCM Token to admin_tokens Table
 */
export async function POST(request: Request) {
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;

    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("admin_tokens")
            .upsert({
                token,
                user_id: auth.uid,
                created_at: new Date().toISOString(),
            });

        if (error) {
            console.error("FCM Token sync error:", error);
            return NextResponse.json({
                error: error.message,
                code: error.code,
                hint: "Ensure the admin_tokens table exists with a TEXT user_id column."
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Token synced" });
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("FCM Token sync catch error:", error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}

/**
 * REMOVE FCM Token (on logout or error)
 */
export async function DELETE(request: Request) {
    const auth = await verifyAdminAuth(request);
    if (auth.error) return auth.error;

    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("admin_tokens")
            .delete()
            .eq("token", token)
            .eq("user_id", auth.uid);

        if (error) {
            const errorMessage = error instanceof Error ? error.message : "Database error";
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Token removed" });
    } catch (err: unknown) {
        console.error("FCM Token removal error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

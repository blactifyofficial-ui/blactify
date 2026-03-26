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
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Token synced" });
    } catch (err: unknown) {
        console.error("FCM Token Sync Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Token removed" });
    } catch (err: unknown) {
        console.error("FCM Token removal error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

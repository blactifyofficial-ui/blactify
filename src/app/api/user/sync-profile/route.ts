import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
export const preferredRegion = "sin1";
import { verifyAuth } from "@/lib/auth-server";

export async function POST(request: Request) {
    const auth = await verifyAuth(request);
    if (auth.error) return auth.error;

    // Rate Limiting: 5 per 5 minutes per user
    const { rateLimit } = await import("@/lib/rate-limit");
    const limiter = await rateLimit(`sync_profile_${auth.uid}`, 5, 300);
    if (!limiter.success) {
        return NextResponse.json({ error: "Too many profile updates. Please wait 5 minutes." }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { id, email, full_name, avatar_url } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }
        if (auth.uid !== id) return NextResponse.json({ error: "Forbidden: You can only sync your own profile" }, { status: 403 });

        const { data, error } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id,
                email,
                full_name,
                avatar_url,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id'
            })
            .select("is_admin")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log the sync/registration action
        const { logAction } = await import("@/lib/logger");
        await logAction({
            action_type: "user_registration",
            user_email: email,
            details: {
                id,
                full_name,
                is_admin: data?.is_admin || false,
                is_sync: true
            }
        });

        return NextResponse.json({
            success: true,
            isAdmin: data?.is_admin || false
        });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

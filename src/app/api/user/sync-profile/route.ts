import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, email, full_name, avatar_url } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id,
                email,
                full_name,
                avatar_url,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id'
            });

        if (error) {
            console.error("Profile sync error details:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Critical error in sync-profile route:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

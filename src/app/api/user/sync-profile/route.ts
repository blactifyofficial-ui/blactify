import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, email, full_name, avatar_url } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

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

        return NextResponse.json({
            success: true,
            isAdmin: data?.is_admin || false
        });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

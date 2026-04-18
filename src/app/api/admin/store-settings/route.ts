import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminAuth } from "@/lib/auth-server";

export async function GET(req: Request) {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) return authResult.error;

    try {
        const { data, error } = await supabaseAdmin
            .from("store_settings")
            .select("*")
            .eq("id", true)
            .single();

        if (error) {
            console.error("Error fetching store settings:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Fatal error in store settings API:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) return authResult.error;

    try {
        const body = await req.json();
        const { isOnline } = body;

        // Toggle both flags: Online means maintenance mode is OFF and purchases are ENABLED
        const { data, error } = await supabaseAdmin
            .from("store_settings")
            .update({ 
                maintenance_mode: !isOnline,
                purchases_enabled: isOnline,
                updated_at: new Date().toISOString()
            })
            .eq("id", true)
            .select()
            .single();

        if (error) {
            console.error("Error updating store settings:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Fatal error in store settings update API:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminAuth } from "@/lib/auth-server";

export async function GET(req: Request) {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) return authResult.error;

    try {
        // First, let's delete notifications that were marked as read more than 24 hours ago
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        await supabaseAdmin
            .from("notifications")
            .delete()
            .eq("is_read", true)
            .lt("read_at", yesterday.toISOString());

        // Fetch latest notifications
        const { data, error } = await supabaseAdmin
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Fatal error in notifications API:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

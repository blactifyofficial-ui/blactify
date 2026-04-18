import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminAuth } from "@/lib/auth-server";

export async function GET(req: Request) {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) return authResult.error;

    try {
        // First, let's delete notifications that were marked as read more than 7 days ago
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        await supabaseAdmin
            .from("notifications")
            .delete()
            .eq("is_read", true)
            .lt("read_at", weekAgo.toISOString());

        // Fetch latest notifications
        const { data, error } = await supabaseAdmin
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);

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

export async function PATCH(req: Request) {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) return authResult.error;

    try {
        const { error } = await supabaseAdmin
            .from("notifications")
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq("is_read", false);

        if (error) {
            console.error("Error marking all notifications as read:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Fatal error in mark all read API:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) return authResult.error;

    try {
        const { error } = await supabaseAdmin
            .from("notifications")
            .delete()
            .neq("id", "placeholder"); // Delete all

        if (error) {
            console.error("Error clearing all notifications:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Fatal error in delete all API:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

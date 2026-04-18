import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminAuth } from "@/lib/auth-server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) return authResult.error;

    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from("notifications")
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error acknowledging notification:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Fatal error in acknowledge API:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

import { createClient } from "@supabase/supabase-js";
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { NextResponse } from 'next/server';
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

const DeleteUserSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = DeleteUserSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
        }

        const { userId } = validated.data;

        // 1. Get user profile to check for avatar_url (Fetch before delete)
        const { data: profile, error: getError } = await supabaseServer
            .from("profiles")
            .select("avatar_url, email")
            .eq("id", userId)
            .single();

        if (getError && getError.code !== 'PGRST116') {
            console.error("Error fetching profile for deletion:", getError);
        }

        // 2. Cleanup Cloudinary if applicable (Side-effect)
        if (profile?.avatar_url) {
            try {
                await deleteFromCloudinary(profile.avatar_url);
            } catch (cloudErr) {
                console.error("Cloudinary cleanup failed during user deletion:", cloudErr);
                // Continue deletion process even if external cleanup fails
            }
        }

        // 3. Delete from Supabase (Core operation)
        // Note: Using service role to bypass RLS
        const { error: deleteError } = await supabaseServer
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (deleteError) {
            if (deleteError.code === '23503') { // Foreign key violation (e.g. has orders)
                return NextResponse.json({
                    error: 'Cannot delete account because you have existing orders. Please contact support to anonymize your data.'
                }, { status: 400 });
            }
            return NextResponse.json({ error: 'Failed to delete profile from database' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Deletion failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

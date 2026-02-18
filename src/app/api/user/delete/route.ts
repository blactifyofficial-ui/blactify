import { createClient } from "@supabase/supabase-js";
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Get user profile to check for avatar_url
        const { data: profile, error: getError } = await supabaseServer
            .from("profiles")
            .select("avatar_url")
            .eq("id", userId)
            .single();

        if (getError && getError.code !== 'PGRST116') {
            // Log error but continue
        }

        // 2. Cleanup Cloudinary if applicable
        if (profile?.avatar_url) {
            try {
                await deleteFromCloudinary(profile.avatar_url);
            } catch (clError) {
                // Continue even if Cloudinary fails
            }
        }

        // 3. Delete from Supabase
        const { error: deleteError } = await supabaseServer
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (deleteError) {
            if (deleteError.code === '23503') { // Foreign key violation
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

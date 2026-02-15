import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

        if (getError && getError.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error("Error fetching profile:", getError);
        }

        // 2. Cleanup Cloudinary if applicable
        if (profile?.avatar_url && profile.avatar_url.includes('cloudinary.com')) {
            try {
                // Typical URL: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/id.jpg
                // We need everything after /upload/v[digits]/ to the end minus extension
                // Or if it was uploaded with a specific folder, it might be simple
                const parts = profile.avatar_url.split('/');

                // If it's in a folder, parts will contain more.
                // A better way is to find the index of 'upload/' and take everything after the version
                const uploadIndex = parts.indexOf('upload');
                if (uploadIndex !== -1 && parts[uploadIndex + 1].startsWith('v')) {
                    const publicIdParts = parts.slice(uploadIndex + 2);
                    const lastPart = publicIdParts[publicIdParts.length - 1];
                    publicIdParts[publicIdParts.length - 1] = lastPart.split('.')[0];
                    const fullPublicId = publicIdParts.join('/');

                    await cloudinary.uploader.destroy(fullPublicId);
                }
            } catch (clError) {
                console.error("Error deleting from Cloudinary:", clError);
                // Continue even if Cloudinary fails
            }
        }

        // 3. Delete from Supabase
        const { error: deleteError } = await supabaseServer
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (deleteError) {
            console.error("Error deleting profile from Supabase:", deleteError);
            if (deleteError.code === '23503') { // Foreign key violation
                return NextResponse.json({
                    error: 'Cannot delete account because you have existing orders. Please contact support to anonymize your data.'
                }, { status: 400 });
            }
            return NextResponse.json({ error: 'Failed to delete profile from database' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Account deletion error:', error);
        const message = error instanceof Error ? error.message : 'Deletion failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

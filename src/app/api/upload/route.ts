import { cloudinary } from '@/lib/cloudinary';
export const preferredRegion = "sin1";
import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-server';
import { z } from "zod";


const UploadSchema = z.object({
    image: z.string().min(1, "No image data provided").refine((s) => s.length < 5 * 1024 * 1024, "Image must be under 5MB"),
});

export async function POST(req: Request) {
    const auth = await verifyAdminAuth(req);
    if (auth.error) return auth.error;
    try {
        const body = await req.json();
        const validated = UploadSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
        }

        const { image } = validated.data;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'blactify-products',
            format: 'webp',
            resource_type: 'image', // Ensure it's treated as an image
        });

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 });
    }
}


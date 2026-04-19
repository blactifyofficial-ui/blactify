import { cloudinary } from '@/lib/cloudinary';
export const preferredRegion = "sin1";
import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-server';
import { z } from "zod";


const UploadSchema = z.object({
    image: z.string().min(1, "No image data provided").refine((s) => s.length < 15 * 1024 * 1024, "Image must be under 15MB"),
});

export async function POST(req: Request) {
    const auth = await verifyAdminAuth(req);
    if (auth.error) return auth.error;
    try {
        const body = await req.json();
        const validated = UploadSchema.safeParse(body);

        if (!validated.success) {
            console.error("[UPLOAD_API] Validation Failed:", validated.error.issues[0].message);
            return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
        }

        const { image } = validated.data;

        // Diagnostic check for production
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            console.error("[UPLOAD_API] Missing Cloudinary Environment Variables");
            return NextResponse.json({ error: "Storage configuration missing on server" }, { status: 500 });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'blactify-products',
            format: 'webp',
            quality: 'auto',
            resource_type: 'image',
        });

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (err: unknown) {
        console.error("[UPLOAD_API] Unexpected Error:", err);
        return NextResponse.json({ 
            error: err instanceof Error ? err.message : 'Upload failed internal server error' 
        }, { status: 500 });
    }
}


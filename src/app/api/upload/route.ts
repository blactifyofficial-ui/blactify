import { cloudinary } from '@/lib/cloudinary';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json() as { image?: string };
        const image = body.image;

        if (!image) {
            return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'blactify-products',
        });

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 });
    }
}

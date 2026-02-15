import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

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
    } catch (error: any) {

        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}

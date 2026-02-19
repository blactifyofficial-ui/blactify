import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts the public_id from a Cloudinary URL and deletes the image.
 * Typical URL: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/id.jpg
 */
export async function deleteFromCloudinary(url: string) {
    if (!url || !url.includes('cloudinary.com')) return;

    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');

        if (uploadIndex !== -1) {
            // The public_id starts 2 positions after 'upload' (skipping the version tag like v12345)
            // It includes the folder and the filename without extension.
            const publicIdParts = parts.slice(uploadIndex + 2);
            const lastPart = publicIdParts[publicIdParts.length - 1];

            // Remove the file extension
            publicIdParts[publicIdParts.length - 1] = lastPart.split('.')[0];
            const publicId = publicIdParts.join('/');

            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        }
    } catch (error) {
        throw error;
    }
}

export { cloudinary };

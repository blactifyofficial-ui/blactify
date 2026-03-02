/**
 * Optimizes a Cloudinary URL by inserting transformation parameters.
 * Converts: .../upload/v123/folder/image.jpg
 * To:        .../upload/f_auto,q_auto,w_<width>/v123/folder/image.jpg
 * 
 * It also handles cases where transformations might already exist by cleaning them first.
 */
export function optimizeCloudinaryUrl(url: string | null | undefined, width: number = 800): string {
    if (!url) return "";

    // Only optimize Cloudinary URLs
    if (!url.includes("res.cloudinary.com")) return url;

    // Remove existing resizing/optimization transformations so we can apply the new ones
    // This regex looks for common Cloudinary transformation patterns and removes them
    const cleanUrl = url.replace(/\/upload\/(?:[a-z]_[^/]+,)*[a-z]_[^/]+\//i, '/upload/');

    const uploadIndex = cleanUrl.indexOf("/upload/");
    if (uploadIndex === -1) return url;

    const beforeUpload = cleanUrl.substring(0, uploadIndex + 8);
    const afterUpload = cleanUrl.substring(uploadIndex + 8);

    // Apply auto format, auto quality, and specific width
    return `${beforeUpload}f_auto,q_auto,w_${width}/${afterUpload}`;
}

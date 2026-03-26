/**
 * Custom Image Loader for Next.js to offload optimization to Cloudinary.
 * This ensures Vercel's "Image Optimization" quota is not used.
 */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    // If it's not a Cloudinary URL, just return it as is but append width to satisfy Next.js check
    if (!src.includes("res.cloudinary.com")) {
        const connector = src.includes('?') ? '&' : '?';
        return `${src}${connector}w=${width}`;
    }

    // 1. Clean up any existing transformations (including those added by optimizeCloudinaryUrl)
    // This looks for /upload/ and removes anything between it and the next slash that looks like a transformation
    // Example: .../upload/w_800,f_auto/v123... -> .../upload/v123...
    const cleanUrl = src.replace(/\/upload\/(?:[a-z]_[^/]+,)*[a-z]_[^/]+\//i, '/upload/');

    const uploadIndex = cleanUrl.indexOf("/upload/");
    if (uploadIndex === -1) return src;

    const beforeUpload = cleanUrl.substring(0, uploadIndex + 8);
    const afterUpload = cleanUrl.substring(uploadIndex + 8);

    // 2. Construct new transformation parameters
    // f_auto: automatic format (WebP/AVIF based on browser)
    // q_auto: automatic quality
    // w_<width>: specific width requested by Next.js for the current device/breakpoint
    const params = [
        `w_${width}`,
        `q_${quality || 'auto'}`,
        'f_auto',
        'c_limit' // Maintain aspect ratio and don't upscale
    ].join(',');

    return `${beforeUpload}${params}/${afterUpload}`;
}

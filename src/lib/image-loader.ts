/**
 * Custom Image Loader for Next.js to offload optimization to Cloudinary or Shopify.
 * This ensures Vercel's "Image Optimization" quota is not used.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    // 1. Handle Cloudinary
    if (src.includes("res.cloudinary.com")) {
        // Clean up any existing transformations
        const cleanUrl = src.replace(/\/upload\/(?:[a-z]_[^/]+,)*[a-z]_[^/]+\//i, '/upload/');
        const uploadIndex = cleanUrl.indexOf("/upload/");
        if (uploadIndex === -1) return src;

        const beforeUpload = cleanUrl.substring(0, uploadIndex + 8);
        const afterUpload = cleanUrl.substring(uploadIndex + 8);

        const params = [
            `w_${width}`,
            `q_${quality || 'auto'}`,
            'f_auto',
            'c_limit'
        ].join(',');

        return `${beforeUpload}${params}/${afterUpload}`;
    }

    // 2. Handle Shopify
    if (src.includes("cdn.shopify.com")) {
        const url = new URL(src);
        // Remove existing width/height/format if any
        url.searchParams.delete("width");
        url.searchParams.delete("height");
        // Append optimized params
        // Shopify automatically handles f_auto equivalent if requested via format=webp (though not always)
        // Modern Shopify supports 'format=webp' or 'format=pjpg'
        url.searchParams.set("width", width.toString());
        url.searchParams.set("format", "webp"); // Force WebP for modernization
        if (quality) url.searchParams.set("quality", quality.toString());
        return url.toString();
    }

    // 3. Handle Google Photos
    if (src.includes("lh3.googleusercontent.com")) {
        // Remove existing sizing/params after the last '=' or if using path-based sizing
        // Google usually appends =s<size> or =w<width>-h<height>
        const baseUrl = src.split('=')[0];
        return `${baseUrl}=w${width}-c`;
    }

    // Default: return as is but append width to satisfy Next.js loader requirement
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}

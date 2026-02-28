/**
 * Optimizes a Cloudinary URL by inserting transformation parameters.
 * Converts: .../upload/v123/folder/image.jpg
 * To:        .../upload/f_auto,q_auto,w_<width>/v123/folder/image.jpg
 *
 * If the URL is not a Cloudinary URL, it is returned as-is.
 */
export function optimizeCloudinaryUrl(url: string, width: number = 800): string {
    if (!url || !url.includes('res.cloudinary.com')) return url;

    // Already has transformations? Return as-is
    if (url.includes('/f_auto') || url.includes('/q_auto') || url.includes('/w_')) return url;

    const transformations = `f_auto,q_auto,w_${width}`;

    // Insert transformations after /upload/
    return url.replace('/upload/', `/upload/${transformations}/`);
}

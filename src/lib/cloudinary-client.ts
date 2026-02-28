export function optimizeCloudinaryUrl(url: string | null | undefined, width: number = 1600): string | null {
    if (!url) return null;

    // Only optimize Cloudinary URLs
    if (!url.includes("res.cloudinary.com")) return url;

    // Remove existing resizing transformations so we can apply the new ones
    // This regex looks for w_, h_, c_, f_, q_ etc and removes that folder path.
    const cleanUrl = url.replace(/\/upload\/(?:[a-zA-Z]_[^/]+,)*[a-zA-Z]_[^/]+\//, '/upload/');

    // Don't modify if it wasn't successfully cleaned (fallback)
    const uploadIndex = cleanUrl.indexOf("upload/");
    if (uploadIndex === -1) return url;

    const beforeUpload = cleanUrl.substring(0, uploadIndex + 7);
    const afterUpload = cleanUrl.substring(uploadIndex + 7);

    return `${beforeUpload}f_auto,q_auto,w_${width}/${afterUpload}`;
}

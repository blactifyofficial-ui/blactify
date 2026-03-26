import type { NextConfig } from "next";
// @ts-expect-error - next-pwa lacks proper types for this version
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Next 16 Turbopack compatibility with next-pwa
  experimental: {
    // turbopack: {}, // Might need this depending on version
  },
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)\\.(woff2|woff|ttf|png|jpg|jpeg|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);

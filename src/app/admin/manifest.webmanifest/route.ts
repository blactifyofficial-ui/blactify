import { NextResponse } from 'next/server';

export function GET() {
    return NextResponse.json({
        name: 'Blactify Admin',
        short_name: 'Blactify Admin',
        description: 'Blactify Administration Panel - Secure Backend Access',
        start_url: '/admin',
        scope: '/admin/',
        display: 'standalone',
        background_color: '#333639',
        theme_color: '#333639',
        icons: [
            {
                src: '/logo.webp',
                sizes: 'any',
                type: 'image/webp',
            },
            {
                src: '/logo-v1.png',
                sizes: '512x512',
                type: 'image/png',
            }
        ],
    }, {
        headers: {
            'Content-Type': 'application/manifest+json',
        },
    });
}

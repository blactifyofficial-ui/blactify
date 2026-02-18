import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Blactify Admin',
        short_name: 'Blactify Admin',
        description: 'Blactify Administration Panel - Secure Backend Access',
        start_url: '/admin',
        scope: '/admin/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
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
    }
}

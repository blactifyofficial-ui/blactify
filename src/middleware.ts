import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Upstash Redis for distributed rate limiting
// Fallback to in-memory Map if variables are missing
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

const rateLimiter = redis 
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(50, '1 m'),
        analytics: true,
        prefix: '@upstash/ratelimit/blactify',
    })
    : null;

// Basic in-memory fallback for local development or missing Redis
const inMemoryRateLimit = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 50;
const WINDOW_MS = 60 * 1000;

export async function middleware(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
    
    // 1. Rate Limiting for sensitive paths
    const isSensitive = request.nextUrl.pathname.startsWith('/api') || 
                       request.nextUrl.pathname.startsWith('/login') || 
                       request.nextUrl.pathname.startsWith('/admin');

    if (isSensitive) {
        if (rateLimiter) {
            // Distributed Rate Limit (Upstash Redis)
            const { success } = await rateLimiter.limit(ip);
            if (!success) {
                return new NextResponse('Too many requests (Rate limited)', { status: 429 });
            }
        } else {
            // In-memory fallback
            const now = Date.now();
            const entry = inMemoryRateLimit.get(ip) || { count: 0, lastReset: now };
            
            if (now - entry.lastReset > WINDOW_MS) {
                entry.count = 1;
                entry.lastReset = now;
            } else {
                entry.count++;
            }
            inMemoryRateLimit.set(ip, entry);

            if (entry.count > LIMIT) {
                return new NextResponse('Too many requests (Rate limited)', { status: 429 });
            }
        }
    }

    // 2. Security Headers
    const nonce = btoa(crypto.randomUUID());
    
    // Hardened CSP
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://*.google.com https://*.firebaseapp.com https://*.razorpay.com https://cdn.shopify.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https://*.googleusercontent.com https://res.cloudinary.com https://cdn.shopify.com https://placehold.co https://*.razorpay.com;
        font-src 'self' https://fonts.gstatic.com;
        frame-src 'self' https://*.razorpay.com https://*.google.com;
        connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebasedatabase.app https://*.supabase.co https://api.razorpay.com https://api.cloudinary.com;
        worker-src 'self' blob:;
        object-src 'none';
        base-uri 'self';
        form-action 'self' https://api.razorpay.com;
        frame-ancestors 'none';
        block-all-mixed-content;
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    const response = NextResponse.next();

    // Standard Security Headers
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    response.headers.set('X-DNS-Prefetch-Control', 'on');

    return response;
}



// Config to specify which paths the middleware should apply to
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

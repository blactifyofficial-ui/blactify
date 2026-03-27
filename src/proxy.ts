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

export async function proxy(request: NextRequest) {
    return NextResponse.next();
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

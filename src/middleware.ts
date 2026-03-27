import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get('host') || '';

    // Define your domains
    const mainDomain = 'blactify.com';
    const devDomain = 'dev.blactify.com';
    const adminDomain = 'admin.blactify.com';

    // 1. If it's the developer domain, rewrite everything to the /developer folder
    if (hostname === devDomain) {
        let path = url.pathname;
        // Prevent double-prefixing if someone uses /developer/ within the subdomain
        if (path.startsWith('/developer')) {
            path = path.replace('/developer', '');
        }
        return NextResponse.rewrite(new URL(`/developer${path === '/' ? '' : path}`, req.url));
    }

    // 2. If it's the admin domain, rewrite everything to the /admin folder
    if (hostname === adminDomain) {
        let path = url.pathname;
        // Prevent double-prefixing if someone uses /admin/ within the subdomain
        if (path.startsWith('/admin')) {
            path = path.replace('/admin', '');
        }
        return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, req.url));
    }

    // 3. Prevent direct access from the main domain to internal sections
    if (process.env.NODE_ENV === 'production') {
        // Redirect developer section
        if (hostname === mainDomain && url.pathname.startsWith('/developer')) {
            const path = url.pathname.replace('/developer', '');
            return NextResponse.redirect(new URL(`https://${devDomain}${path}`, req.url));
        }
        // Redirect admin section
        if (hostname === mainDomain && url.pathname.startsWith('/admin')) {
            const path = url.pathname.replace('/admin', '');
            return NextResponse.redirect(new URL(`https://${adminDomain}${path}`, req.url));
        }
    }

    return NextResponse.next();
}

// Next.js middleware configuration
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes stay at both)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

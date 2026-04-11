import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
    const url = req.nextUrl;
    const host = req.headers.get('host') || '';
    
    // Normalize hostname: lower case and remove port if present
    const hostname = host.split(':')[0].toLowerCase();

    // Define your domains
    const mainDomain = 'blactify.com';
    const wwwDomain = 'www.blactify.com';
    const devDomain = 'dev.blactify.com';
    const adminDomain = 'admin.blactify.com';

    const isMainHost = hostname === mainDomain || hostname === wwwDomain;

    // 1. If it's the developer domain, rewrite everything to the /developer folder
    if (hostname === devDomain) {
        let path = url.pathname;

        // Allow admin-related paths (like login) on all domains
        if (path.startsWith('/admin')) {
            return NextResponse.next();
        }

        // Prevent double-prefixing if someone uses /developer/ within the subdomain
        if (path.startsWith('/developer')) {
            path = path.replace('/developer', '');
        }
        
        // Ensure path starts with / for the rewrite
        const rewritePath = path === '' ? '/' : (path.startsWith('/') ? path : `/${path}`);
        return NextResponse.rewrite(new URL(`/developer${rewritePath === '/' ? '' : rewritePath}`, req.url));
    }

    // 2. If it's the admin domain, rewrite everything to the /admin folder
    if (hostname === adminDomain) {
        let path = url.pathname;
        // Prevent double-prefixing if someone uses /admin/ within the subdomain
        if (path.startsWith('/admin')) {
            path = path.replace('/admin', '');
        }
        
        // Ensure path starts with / for the rewrite
        const rewritePath = path === '' ? '/' : (path.startsWith('/') ? path : `/${path}`);
        return NextResponse.rewrite(new URL(`/admin${rewritePath === '/' ? '' : rewritePath}`, req.url));
    }

    // 3. Handle main domain redirects in production
    if (process.env.NODE_ENV === 'production') {
        // Redirect developer section from main domain or www to the dev subdomain
        if (isMainHost && url.pathname.startsWith('/developer')) {
            let path = url.pathname.replace('/developer', '');
            // Ensure path starts with /
            if (path !== '' && !path.startsWith('/')) {
                path = '/' + path;
            }
            return NextResponse.redirect(`https://${devDomain}${path}`, { status: 308 });
        }
        
        // Redirect admin section from main domain or www to the admin subdomain
        if (isMainHost && url.pathname.startsWith('/admin')) {
            let path = url.pathname.replace('/admin', '');
            // Ensure path starts with /
            if (path !== '' && !path.startsWith('/')) {
                path = '/' + path;
            }
            return NextResponse.redirect(`https://${adminDomain}${path}`, { status: 308 });
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
         * - Manifest files (for PWA)
         * - Service Worker files
         * - Images and other static assets at root
         */
        '/((?!api|_next/static|_next/image|favicon.ico|admin-manifest.json|developer-manifest.json|sw.js|firebase-messaging-sw.js|logo.webp|logo-v1.png|icon.png|robots.txt|sitemap.xml).*)',
    ],
};


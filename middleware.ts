// middleware.ts - Enhanced with subscription checks
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public routes that don't require authentication
const publicRoutes = [
    '/',
    '/login',
    '/pricing',
    '/api/auth',
    '/api/auth/signin',
    '/api/auth/callback',
    '/api/auth/session',
    '/api/auth/providers',
    '/_next',
    '/favicon.ico',
    '/api/cron',
];

// Define routes that require authentication but not onboarding
const authOnlyRoutes = [
    '/onboard',
];

// Define routes that require Gold membership
const goldOnlyRoutes = [
    '/interview',
    '/interview-prep'
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Get session token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // If not authenticated, redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // For auth-only routes (like onboarding), allow access
    if (authOnlyRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check for Gold membership required routes
    if (goldOnlyRoutes.some(route => pathname.startsWith(route))) {
        // Add subscription tier to headers so the page component can access it
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-email', token.email || '');
        
        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
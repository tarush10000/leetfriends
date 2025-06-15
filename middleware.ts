// middleware.ts - Global authentication middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/api/auth',
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/session',
  '/api/auth/providers',
  '/_next',
  '/favicon.ico',
  '/api/cron', // Allow cron jobs
];

// Define routes that require authentication but not onboarding
const authOnlyRoutes = [
  '/onboard',
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

  // For all other authenticated routes, check if user is onboarded
  // We'll handle this check in the individual page components
  // to avoid making database calls in middleware
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
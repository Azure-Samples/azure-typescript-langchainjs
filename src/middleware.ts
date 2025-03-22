import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware function for Next.js
 * 
 * Currently this middleware only adds response headers for security,
 * but it can be expanded to include authentication and other functionality.
 */
export function middleware(_request: NextRequest) {
  // Get the response
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * Define which paths this middleware should run on.
 * Currently only running on API routes.
 */
export const config = {
  matcher: '/api/:path*',
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get allowed IPs from environment variable (comma-separated)
  const allowedIps = process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];

  // If no IPs configured, allow all access
  if (allowedIps.length === 0) {
    return NextResponse.next();
  }

  // Get client IP from Vercel headers
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  // Check if client IP is in allowed list
  if (allowedIps.includes(clientIp)) {
    return NextResponse.next();
  }

  // Return 403 Forbidden for unauthorized IPs
  return new NextResponse(
    JSON.stringify({ error: 'Access denied', message: 'Your IP is not authorized' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Apply middleware to all routes except API
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes - open for MCP server)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

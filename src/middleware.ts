import { NextResponse, type NextRequest } from 'next/server';
import { validateApiKey } from './middleware/auth';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import { logger } from './utils/logger';

export const config = {
  matcher: '/api/:path*',
};

export async function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handlePreflight(request);
  }

  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiterMiddleware(request);
    if (rateLimitResult.status !== 200) {
      return addCorsHeaders(rateLimitResult, request);
    }

    // Apply API key validation
    const authResult = await validateApiKey(request);
    if (authResult.status !== 200) {
      return addCorsHeaders(authResult, request);
    }

    // Continue to the API route
    const response = NextResponse.next();
    return addCorsHeaders(response, request);
  } catch (error) {
    logger.error('Middleware error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, request);
  }
}

function handlePreflight(request: NextRequest) {
  return addCorsHeaders(
    new NextResponse(null, { status: 204 }),
    request
  );
}

function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // Required for credentials
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Allow specific headers and methods
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-API-Key, Content-Type, Authorization'
  );
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  // Cache preflight requests for 24 hours
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

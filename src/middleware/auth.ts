import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';

export async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!process.env.API_KEY) {
    logger.error('API_KEY environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }

  if (!apiKey) {
    logger.warn('API request received without API key');
    return NextResponse.json(
      { error: 'API key is required' },
      { status: StatusCodes.UNAUTHORIZED }
    );
  }

  if (apiKey !== process.env.API_KEY) {
    // Get IP from various possible headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    logger.warn('Invalid API key used in request', { 
      clientIp,
      userAgent: request.headers.get('user-agent') 
    });
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: StatusCodes.UNAUTHORIZED }
    );
  }

  return NextResponse.next();
}

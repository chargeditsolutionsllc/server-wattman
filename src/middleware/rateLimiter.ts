import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { StatusCodes } from 'http-status-codes';
import redisClient from './redis';
import { logger } from '../utils/logger';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ratelimit',
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10), // Per minute
  blockDuration: 60 * 2, // Block for 2 minutes if limit exceeded
});

export async function rateLimiterMiddleware(request: NextRequest) {
  // Get client IP from headers or fallback
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

  try {
    await rateLimiter.consume(clientIp);
    return NextResponse.next();
  } catch (error) {
    if (error instanceof Error) {
      logger.warn('Rate limit exceeded', {
        clientIp,
        userAgent: request.headers.get('user-agent'),
        error: error.message,
      });
    }

    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { 
        status: StatusCodes.TOO_MANY_REQUESTS,
        headers: {
          'Retry-After': '120', // 2 minutes
        },
      }
    );
  }
}

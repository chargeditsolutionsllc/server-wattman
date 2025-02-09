import { NextRequest, NextResponse } from 'next/server';
import redisClient from '../../../middleware/redis';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../../utils/logger';
import { getServerConfigs } from '../../../config/servers';
import { getAllCachedPowerData } from '../../../utils/cache';
import { PowerData } from '../../../types/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    redis: {
      status: 'connected' | 'disconnected';
      error?: string;
    };
    serverMonitoring: {
      totalServers: number;
      onlineServers: number;
      offlineServers: number;
      lastUpdateTime?: string;
      recentErrors: Array<{
        serverName: string;
        error: string;
        timestamp: string;
      }>;
    };
  };
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check Redis connection
    const redisStatus = await checkRedisHealth();

    // Get server configurations
    const servers = await getServerConfigs();
    
    // Get latest power data from cache
    const powerData = await getAllCachedPowerData();
    
    // Calculate server monitoring status
    const serverStatus = calculateServerStatus(servers.length, powerData);

    const healthStatus: HealthStatus = {
      status: determineOverallStatus(redisStatus.status, serverStatus),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        redis: redisStatus,
        serverMonitoring: serverStatus
      },
      uptime: process.uptime(),
      memoryUsage: getMemoryUsage()
    };

    // Log health check
    logger.info('Health check performed', {
      status: healthStatus.status,
      redisStatus: redisStatus.status,
      serverCount: serverStatus.totalServers,
      onlineCount: serverStatus.onlineServers
    });

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === 'healthy' 
        ? StatusCodes.OK 
        : StatusCodes.SERVICE_UNAVAILABLE
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

async function checkRedisHealth() {
  try {
    await redisClient.ping();
    return { status: 'connected' as const };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return { 
      status: 'disconnected' as const, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function calculateServerStatus(totalServers: number, powerData: PowerData[]) {
  const onlineServers = powerData.filter(data => !data.error).length;
  const offlineServers = totalServers - onlineServers;
  
  const recentErrors = powerData
    .filter(data => data.error)
    .map(data => ({
      serverName: data.serverName,
      error: data.error || 'Unknown error',
      timestamp: data.timestamp
    }));

  return {
    totalServers,
    onlineServers,
    offlineServers,
    lastUpdateTime: powerData.length > 0 
      ? powerData[0].timestamp 
      : new Date().toISOString(),
    recentErrors
  };
}

function determineOverallStatus(
  redisStatus: 'connected' | 'disconnected',
  serverStatus: { onlineServers: number; totalServers: number }
): HealthStatus['status'] {
  if (redisStatus === 'disconnected') {
    return 'unhealthy';
  }

  const serverAvailabilityPercent = 
    (serverStatus.onlineServers / serverStatus.totalServers) * 100;

  if (serverAvailabilityPercent >= 90) {
    return 'healthy';
  } else if (serverAvailabilityPercent >= 50) {
    return 'degraded';
  }
  return 'unhealthy';
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024) // MB
  };
}

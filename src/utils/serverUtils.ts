import { ServerConfig, PowerData } from '../types/server';
import fetch, { Response } from 'node-fetch';
import https from 'https';
import { logger } from './logger';
import { getCachedPowerData, setCachedPowerData } from './cache';
import { getServerConfigs } from '../config/servers';

interface ServerPowerResponse {
  PowerControl?: Array<{
    PowerConsumedWatts?: number;
  }>;
}

interface FetchOptions {
  headers: {
    [key: string]: string;
  };
  agent: https.Agent;
  timeout: number;
}

const agent = new https.Agent({ 
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 10000,
});

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, options: FetchOptions, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
      logger.warn(`Retrying request to ${url} after ${delay}ms. Attempts remaining: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

async function fetchServerPowerData(server: ServerConfig): Promise<PowerData> {
  // Try to get cached data first
  const cachedData = await getCachedPowerData(server.name);
  if (cachedData) {
    return cachedData;
  }

  try {
    const credentials = Buffer.from(`${server.username}:${server.password}`).toString('base64');
    const baseUrl = `https://${server.ip}/redfish/v1`;
    const powerEndpoint = server.type === 'iLO' 
      ? '/Chassis/1/Power'
      : '/Chassis/System.Embedded.1/Power';

    const startTime = Date.now();
    const response = await fetchWithRetry(`${baseUrl}${powerEndpoint}`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
      agent,
      timeout: parseInt(process.env.SERVER_REQUEST_TIMEOUT || '10000', 10)
    });

    const data = await response.json() as ServerPowerResponse;
    const responseTime = Date.now() - startTime;
    
    // Log response time for monitoring
    logger.debug('Server response time', {
      server: server.name,
      responseTime,
      endpoint: powerEndpoint
    });
    
    // Get all power readings from PowerControl array
    const powerReadings = data.PowerControl?.map(control => control.PowerConsumedWatts || 0) || [];
    
    // Get the highest power reading
    const powerConsumption = Math.max(...powerReadings);

    if (powerReadings.length === 0 || powerConsumption === 0) {
      throw new Error(`Unable to read power consumption from ${server.name}`);
    }

    const powerData = {
      serverName: server.name,
      powerConsumption,
      unit: 'Watts',
      timestamp: new Date().toISOString(),
    };

    // Cache the successful response
    await setCachedPowerData(powerData);

    return powerData;
  } catch (error) {
    // Log detailed error information
    logger.error('Error fetching server power data', {
      server: server.name,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return {
      serverName: server.name,
      powerConsumption: 0,
      unit: 'Watts',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function fetchAllServersPower(): Promise<PowerData[]> {
  logger.info('Starting power data fetch for all servers');
  const startTime = Date.now();

  try {
    const servers = await getServerConfigs();
    const promises = servers.map(server => fetchServerPowerData(server));
    const results = await Promise.all(promises);

    const endTime = Date.now();
    logger.info('Completed power data fetch', {
      totalServers: servers.length,
      successfulFetches: results.filter(result => !result.error).length,
      failedFetches: results.filter(result => result.error).length,
      totalTime: endTime - startTime
    });

    return results;
  } catch (error) {
    logger.error('Critical error in fetchAllServersPower:', error);
    throw error;
  }
}

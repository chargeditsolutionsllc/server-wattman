import { ServerConfig } from '../types/server';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export async function loadServerConfigs(): Promise<ServerConfig[]> {
  try {
    // First try to load from environment variable path
    const configPath = process.env.SERVER_CONFIGS_PATH;
    if (configPath) {
      return loadFromFile(configPath);
    }

    // Otherwise, try to load from environment variables directly
    return loadFromEnv();
  } catch (error) {
    logger.error('Failed to load server configurations:', error);
    throw new Error('Server configuration loading failed');
  }
}

function loadFromFile(configPath: string): ServerConfig[] {
  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const configs = JSON.parse(fileContent) as ServerConfig[];
    validateConfigs(configs);
    return configs;
  } catch (error) {
    logger.error(`Failed to load server configs from file ${configPath}:`, error);
    throw error;
  }
}

function loadFromEnv(): ServerConfig[] {
  const serverConfigs: ServerConfig[] = [];
  let serverIndex = 1;

  while (true) {
    const serverName = process.env[`SERVER_${serverIndex}_NAME`];
    if (!serverName) break;

    const config: ServerConfig = {
      name: serverName,
      type: process.env[`SERVER_${serverIndex}_TYPE`] as 'iLO' | 'iDRAC',
      ip: process.env[`SERVER_${serverIndex}_IP`] || '',
      username: process.env[`SERVER_${serverIndex}_USERNAME`] || '',
      password: process.env[`SERVER_${serverIndex}_PASSWORD`] || '',
    };

    if (!isValidConfig(config)) {
      logger.error(`Invalid configuration for server ${serverName}`);
      throw new Error(`Invalid configuration for server ${serverName}`);
    }

    serverConfigs.push(config);
    serverIndex++;
  }

  if (serverConfigs.length === 0) {
    logger.error('No server configurations found in environment variables');
    throw new Error('No server configurations found');
  }

  return serverConfigs;
}

function isValidConfig(config: ServerConfig): boolean {
  return (
    typeof config.name === 'string' &&
    config.name.length > 0 &&
    (config.type === 'iLO' || config.type === 'iDRAC') &&
    typeof config.ip === 'string' &&
    config.ip.length > 0 &&
    typeof config.username === 'string' &&
    config.username.length > 0 &&
    typeof config.password === 'string' &&
    config.password.length > 0
  );
}

function validateConfigs(configs: ServerConfig[]) {
  if (!Array.isArray(configs)) {
    throw new Error('Server configurations must be an array');
  }

  if (configs.length === 0) {
    throw new Error('No server configurations found');
  }

  configs.forEach((config, index) => {
    if (!isValidConfig(config)) {
      throw new Error(`Invalid configuration for server at index ${index}`);
    }
  });
}

export const getServerConfigs = async (): Promise<ServerConfig[]> => {
  // Singleton pattern to cache the configurations
  if (!getServerConfigs.configs) {
    getServerConfigs.configs = await loadServerConfigs();
  }
  return getServerConfigs.configs;
};

// Add configs property to the function
getServerConfigs.configs = undefined as ServerConfig[] | undefined;

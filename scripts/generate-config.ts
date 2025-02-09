#!/usr/bin/env ts-node
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { ServerConfig } from '../src/types/server';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateSecurePassword(): string {
  const length = 24;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(charset.length);
    password += charset[randomIndex];
  }
  return password;
}

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('Server Power Monitor Configuration Generator\n');
  
  // Generate API key
  const apiKey = generateApiKey();
  console.log(`Generated API Key: ${apiKey}\n`);

  const servers: ServerConfig[] = [];
  let addMore = true;

  while (addMore) {
    console.log('\nEnter server details:');
    const name = await question('Server Name: ');
    const type = await question('Server Type (iLO/iDRAC): ');
    const ip = await question('IP Address: ');
    const username = await question('Username: ');
    
    // Option to generate or input password
    const genPassword = (await question('Generate secure password? (y/n): ')).toLowerCase() === 'y';
    const password = genPassword ? generateSecurePassword() : await question('Password: ');
    
    if (genPassword) {
      console.log(`Generated password: ${password}`);
    }

    servers.push({
      name,
      type: type as 'iLO' | 'iDRAC',
      ip,
      username,
      password
    });

    const cont = await question('\nAdd another server? (y/n): ');
    addMore = cont.toLowerCase() === 'y';
  }

  // Generate configuration files
  const configDir = path.join(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }

  // Save server configurations
  const serverConfigPath = path.join(configDir, 'servers.json');
  fs.writeFileSync(serverConfigPath, JSON.stringify(servers, null, 2));
  console.log(`\nServer configurations saved to: ${serverConfigPath}`);

  // Generate .env file
  const envContent = `# API Configuration
API_KEY=${apiKey}

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
SERVER_CONFIGS_PATH=${serverConfigPath}

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# iLO/iDRAC Default Timeouts (ms)
SERVER_REQUEST_TIMEOUT=10000

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# Security
CORS_ORIGINS=http://localhost:3000
TLS_KEY_PATH=/path/to/key.pem
TLS_CERT_PATH=/path/to/cert.pem
`;

  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent);
  console.log(`Environment configuration saved to: ${envPath}`);

  // Generate a backup of sensitive data
  const backupContent = {
    apiKey,
    servers: servers.map(s => ({
      name: s.name,
      type: s.type,
      ip: s.ip,
      username: s.username,
      password: s.password
    }))
  };

  const backupPath = path.join(configDir, 'credentials-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupContent, null, 2));
  console.log(`\nCredentials backup saved to: ${backupPath}`);
  console.log('\nIMPORTANT: Store the credentials backup in a secure location and delete it from the server after setup.');

  rl.close();
}

main().catch(console.error);

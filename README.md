# Server Wattman

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-%3E%3D24.0.0-blue)](https://www.docker.com/)

A high-performance monitoring solution for iLO and iDRAC server power consumption metrics, built with Next.js.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

Server Power Monitor provides real-time power consumption tracking for enterprise server infrastructure through HP iLO and Dell iDRAC interfaces.

## Features

- Real-time power consumption monitoring
- Support for HP iLO and Dell iDRAC interfaces
- Unified dashboard for multiple servers
- Dark mode support
- Redis-powered caching
- Rate limiting and throttling
- Structured logging
- Health monitoring
- API key authentication

## Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Node.js 20
- **Caching**: Redis 7
- **Containerization**: Docker
- **SSL/TLS**: HTTPS-Portal with Let's Encrypt

## Getting Started

### Prerequisites
- Node.js 20 or later
- Docker Engine 24.0+
- Docker Compose v2
- Git

### Installation

1. Clone and setup:
\`\`\`bash
git clone https://github.com/yourusername/server-power-monitor.git
cd server-power-monitor
npm install
\`\`\`

2. Configure environment:
\`\`\`bash
cp .env.example .env
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
\`\`\`

### Configuration

Create a \`.env\` file:
\`\`\`bash
API_KEY=your-secure-api-key
REDIS_URL=redis://redis:6379
SERVER_CONFIGS_PATH=/path/to/config.json
DOMAINS=yourdomain.com
STAGE=production
\`\`\`

Configure servers in JSON:
\`\`\`json
{
  "servers": [
    {
      "name": "server1",
      "type": "iLO",
      "ip": "10.0.0.1",
      "username": "admin",
      "password": "secure-password"
    }
  ]
}
\`\`\`

## API Documentation

### Authentication
API endpoints require an API key in the \`X-API-Key\` header:
\`\`\`bash
curl -H "X-API-Key: your-api-key" https://your-domain.com/api/health
\`\`\`

### Endpoints

#### Health Check
\`GET /api/health\`
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2025-02-09T20:52:23.000Z",
  "version": "1.0.0",
  "services": {
    "redis": { "status": "connected" },
    "serverMonitoring": {
      "totalServers": 10,
      "onlineServers": 10
    }
  }
}
\`\`\`

#### Server Power Data
\`GET /api/servers/{serverId}/power\`
\`\`\`json
{
  "serverId": "server1",
  "timestamp": "2025-02-09T20:52:23.000Z",
  "currentPower": 120,
  "averagePower": 115,
  "peakPower": 150
}
\`\`\`

## Security

- API key authentication
- Rate limiting per client
- CORS protection
- Automatic SSL certificate management
- Input validation
- Error sanitization

## Monitoring

- Health check endpoint at \`/api/health\`
- Redis health monitoring (10s interval)
- Memory usage tracking
- Response time monitoring
- Error rate tracking

## Troubleshooting

1. **Redis Connection Failed**
   - Check: \`docker compose ps\`
   - Verify Redis URL in .env

2. **iLO/iDRAC Connection Timeout**
   - Verify server IP accessibility
   - Check firewall settings

3. **Rate Limiting Errors**
   - Adjust RATE_LIMIT settings in .env

Debug mode:
\`\`\`bash
DEBUG=true npm run dev
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Open a Pull Request

## License

MIT License

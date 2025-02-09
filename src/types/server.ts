export interface ServerConfig {
  name: string;
  type: 'iLO' | 'iDRAC';
  ip: string;
  username: string;
  password: string;
}

export interface PowerData {
  serverName: string;
  powerConsumption: number;
  unit: string;
  timestamp: string;
  error?: string;
}

// Server status types for monitoring
export interface ServerStatus {
  name: string;
  type: 'iLO' | 'iDRAC';
  status: 'online' | 'offline' | 'error';
  lastCheck: string;
  responseTime?: number;
  error?: string;
}
